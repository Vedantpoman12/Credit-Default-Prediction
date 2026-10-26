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
        X[cols] = X[cols].clip(self.lower_, self.upper_, axis=1)
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
        ("sentinels", SentinelCleaner(p["sentinels"])),
        ("age", InvalidAgeFixer(valid_range=tuple(CFG["age_bands"]["valid_range"]))),
        ("winsor", Winsorizer(p["winsorize"], tuple(p["winsor_quantiles"]))),
        ("impute", MedianImputer()),
    ])


def base_feature(name: str) -> str:
    for suffix in ("_sentinel", "_missing"):
        name = name.removesuffix(suffix)
    return name
