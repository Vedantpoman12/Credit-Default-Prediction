import warnings

import numpy as np
import pandas as pd
from fairlearn.postprocessing import ThresholdOptimizer
from fairlearn.reductions import ExponentiatedGradient
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.isotonic import IsotonicRegression
from xgboost import XGBClassifier

from src.features.pipeline import build_pipeline

warnings.filterwarnings("ignore", category=FutureWarning, module="fairlearn")


class XGBPipelineClassifier(BaseEstimator, ClassifierMixin):
    """Preprocessing + XGBoost that accepts sample_weight directly (needed by ExponentiatedGradient)."""

    def __init__(self, params: dict | None = None, seed: int = 42):
        self.params = params
        self.seed = seed

    def fit(self, X: pd.DataFrame, y, sample_weight=None):
        self.prep_ = build_pipeline().fit(X)
        self.model_ = XGBClassifier(**(self.params or {}), tree_method="hist", random_state=self.seed, n_jobs=4)
        self.model_.fit(self.prep_.transform(X), y, sample_weight=sample_weight)
        self.classes_ = self.model_.classes_
        return self

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        return self.model_.predict_proba(self.prep_.transform(X))

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        return (self.predict_proba(X)[:, 1] >= 0.5).astype(int)


def row_uniform(X: pd.DataFrame) -> np.ndarray:
    """Deterministic per-applicant uniform draw, so randomised fairness policies give repeatable decisions."""
    return pd.util.hash_pandas_object(X.astype(float).round(6), index=False).to_numpy() / np.float64(2**64)


class FairPolicy:
    """Single loadable decision policy: calibrated probability + deterministic fairness-constrained flag."""

    def __init__(self, kind: str, calibrated, mitigator=None, threshold: float = 0.5, mixture_calibrator: IsotonicRegression | None = None):
        self.kind = kind
        self.calibrated = calibrated
        self.mitigator = mitigator
        self.threshold = threshold
        self.mixture_calibrator = mixture_calibrator

    @property
    def needs_sensitive(self) -> bool:
        return isinstance(self.mitigator, ThresholdOptimizer)

    def mixture_score(self, X: pd.DataFrame) -> np.ndarray:
        eg: ExponentiatedGradient = self.mitigator
        return sum(w * eg.predictors_[i].predict_proba(X)[:, 1] for i, w in eg.weights_.items() if w > 0)

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        if self.kind == "exponentiated_gradient":
            return self.mixture_calibrator.predict(self.mixture_score(X))
        return self.calibrated.predict_proba(X)[:, 1]

    def decision_score(self, X: pd.DataFrame, sensitive=None) -> np.ndarray:
        if self.kind == "exponentiated_gradient":
            return self.mitigator._pmf_predict(X)[:, 1]
        if self.kind == "threshold_optimizer":
            return self.mitigator._pmf_predict(X, sensitive_features=np.asarray(sensitive))[:, 1]
        return self.predict_proba(X)

    def flag(self, X: pd.DataFrame, sensitive=None) -> np.ndarray:
        if self.kind == "unconstrained":
            return (self.predict_proba(X) >= self.threshold).astype(int)
        return (row_uniform(X) < self.decision_score(X, sensitive)).astype(int)
