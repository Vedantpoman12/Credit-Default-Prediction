import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline

from src.config import CFG


class SentinelCleaner(BaseEstimator, TransformerMixin):
    """Replace undocumented codes with NaN and add a flag column per cleaned feature."""

    def __init__(self, sentinels: dict[str, list[int]] | None = None):
        self.sentinels = sentinels

    def fit(self, X: pd.DataFrame, y=None):
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        X = X.copy()
        for col, codes in (self.sentinels or {}).items():
            mask = X[col].isin(codes)
            X[f"{col}_sentinel"] = mask.astype(int)
            X[col] = X[col].where(~mask, np.nan)
        return X


class InvalidAgeFixer(BaseEstimator, TransformerMixin):
    def __init__(self, column: str = "AGE", valid_range: tuple[int, int] = (18, 100)):
        self.column = column
        self.valid_range = valid_range

    def fit(self, X: pd.DataFrame, y=None):
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        if self.column not in X:
            return X
        X = X.copy()
        X[self.column] = X[self.column].where(X[self.column].between(*self.valid_range), np.nan)
        return X


class FeatureBuilder(BaseEstimator, TransformerMixin):
    """Stateless credit-domain features: utilisation, repayment ratios and delinquency summaries."""

    PAY_STATUS = ["PAY_0", "PAY_2", "PAY_3", "PAY_4", "PAY_5", "PAY_6"]

    def fit(self, X: pd.DataFrame, y=None):
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        X = X.copy()
        limit = X["LIMIT_BAL"].clip(lower=1)
        for k in range(1, 7):
            X[f"UTIL_{k}"] = X[f"BILL_AMT{k}"] / limit
        for k in range(1, 6):
            X[f"PAY_RATIO_{k}"] = (X[f"PAY_AMT{k}"] / X[f"BILL_AMT{k + 1}"].clip(lower=1)).clip(0, 5)
        util = X[[f"UTIL_{k}" for k in range(1, 7)]]
        X["UTIL_MEAN"], X["UTIL_MAX"] = util.mean(axis=1), util.max(axis=1)
        X["UTIL_TREND"] = X["UTIL_1"] - X["UTIL_6"]
        status = X[self.PAY_STATUS]
        X["MONTHS_LATE"] = (status > 0).sum(axis=1)
        X["MAX_DELAY"] = status.max(axis=1)
        X["MEAN_STATUS"] = status.mean(axis=1)
        paid = X[[f"PAY_AMT{k}" for k in range(1, 6)]].sum(axis=1)
        billed = X[[f"BILL_AMT{k}" for k in range(2, 7)]].sum(axis=1).clip(lower=1)
        X["PAID_TO_BILLED"] = (paid / billed).clip(0, 5)
        X["HEADROOM"] = (X["LIMIT_BAL"] - X["BILL_AMT1"]) / limit
        return X


class Winsorizer(BaseEstimator, TransformerMixin):
    def __init__(self, columns: list[str] | None = None, quantiles: tuple[float, float] = (0.01, 0.99)):
        self.columns = columns
        self.quantiles = quantiles

    def fit(self, X: pd.DataFrame, y=None):
        cols = self.columns or list(X.columns)
        self.lower_ = X[cols].quantile(self.quantiles[0])
        self.upper_ = X[cols].quantile(self.quantiles[1])
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        X = X.copy()
        cols = list(self.lower_.index)
        X[cols] = X[cols].astype(float).clip(self.lower_, self.upper_, axis=1)
        return X


class MedianImputer(BaseEstimator, TransformerMixin):
    def fit(self, X: pd.DataFrame, y=None):
        self.medians_ = X.median()
        self.indicator_cols_ = [c for c in X.columns if X[c].isna().any()]
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        X = X.copy()
        for c in self.indicator_cols_:
            X[f"{c}_missing"] = X[c].isna().astype(int)
        return X.fillna(self.medians_)


def build_pipeline() -> Pipeline:
    p = CFG["primary"]
    return Pipeline([
        ("features", FeatureBuilder()),
        ("sentinels", SentinelCleaner(p["sentinels"])),
        ("age", InvalidAgeFixer(valid_range=tuple(CFG["age_bands"]["valid_range"]))),
        ("winsor", Winsorizer(p["winsorize"], tuple(p["winsor_quantiles"]))),
        ("impute", MedianImputer()),
    ])


def monotone_constraints(columns) -> dict[str, int]:
    """+1: risk may only rise with the feature, -1: only fall, 0: unconstrained (flags and other features)."""
    up, down = set(CFG["monotone"]["increasing"]), set(CFG["monotone"]["decreasing"])
    return {c: 1 if c in up else -1 if c in down else 0 for c in columns}


def base_feature(name: str) -> str:
    for suffix in ("_sentinel", "_missing"):
        name = name.removesuffix(suffix)
    return name
