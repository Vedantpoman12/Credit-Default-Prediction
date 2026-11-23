import warnings

import numpy as np
import pandas as pd
from fairlearn.postprocessing import ThresholdOptimizer
from fairlearn.reductions import ExponentiatedGradient
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.isotonic import IsotonicRegression
from xgboost import XGBClassifier

from src.features.pipeline import build_pipeline, monotone_constraints

warnings.filterwarnings("ignore", category=FutureWarning, module="fairlearn")


class XGBPipelineClassifier(BaseEstimator, ClassifierMixin):
    """Preprocessing + XGBoost that accepts sample_weight directly (needed by ExponentiatedGradient)."""

    def __init__(self, params: dict | None = None, seed: int = 42):
        self.params = params
        self.seed = seed

    def fit(self, X: pd.DataFrame, y, sample_weight=None):
        self.prep_ = build_pipeline().fit(X)
        self.model_ = XGBClassifier(**(self.params or {}), tree_method="hist", random_state=self.seed, n_jobs=4,
                                    monotone_constraints=monotone_constraints(self.prep_.transform(X.head(1)).columns))
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


class GroupThresholds:
    """Deterministic equal-opportunity post-processing: one score threshold per group so every group reaches the same TPR."""

    def __init__(self, model, min_group_n: int = 30):
        self.model = model
        self.min_group_n = min_group_n

    def score(self, X: pd.DataFrame) -> np.ndarray:
        return self.model.predict_proba(X)[:, 1]

    def fit(self, X: pd.DataFrame, y, sensitive, global_threshold: float):
        s, y, g = self.score(X), np.asarray(y), np.asarray(sensitive)
        self.default_ = float(global_threshold)
        self.target_tpr_ = float((s[y == 1] >= self.default_).mean())
        self.thresholds_ = {}
        for group in np.unique(g):
            pos = np.sort(s[(g == group) & (y == 1)])
            if (g == group).sum() >= self.min_group_n and len(pos):
                k = int(round((1 - self.target_tpr_) * len(pos)))
                self.thresholds_[group] = float(pos[min(k, len(pos) - 1)])
        return self

    def predict(self, X: pd.DataFrame, sensitive) -> np.ndarray:
        t = np.array([self.thresholds_.get(g, self.default_) for g in np.asarray(sensitive)])
        return (self.score(X) >= t).astype(int)


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
        return isinstance(self.mitigator, (ThresholdOptimizer, GroupThresholds))

    # --- ExponentiatedGradient fast path -------------------------------------------------------
    # Every EG member is fitted on the same training X (only labels/weights differ), so their
    # preprocessing pipelines are identical. Transforming once and reusing the matrix gives the
    # same numbers as calling each member separately, at a fraction of the cost.
    def _live_members(self) -> list[tuple[XGBPipelineClassifier, float]]:
        eg: ExponentiatedGradient = self.mitigator
        return [(eg.predictors_[i], w) for i, w in eg.weights_.items() if w > 0]

    @property
    def shared_prep(self):
        """The members' common fitted preprocessing pipeline, or None if they differ."""
        if "_shared_prep" not in self.__dict__:
            members = [m for m, _ in self._live_members()]
            first = members[0].prep_
            self.__dict__["_shared_prep"] = first if all(same_prep(first, m.prep_) for m in members[1:]) else None
        return self.__dict__["_shared_prep"]

    def _member_probs(self, X: pd.DataFrame, Xt: pd.DataFrame | None = None) -> list[tuple[np.ndarray, float]]:
        members = self._live_members()
        if Xt is None and self.shared_prep is not None:
            Xt = self.shared_prep.transform(X)
        if Xt is None:
            return [(m.predict_proba(X)[:, 1], w) for m, w in members]
        return [(m.model_.predict_proba(Xt)[:, 1], w) for m, w in members]

    def mixture_score(self, X: pd.DataFrame, Xt: pd.DataFrame | None = None) -> np.ndarray:
        return sum(w * p for p, w in self._member_probs(X, Xt))

    def score(self, X: pd.DataFrame, sensitive=None, Xt: pd.DataFrame | None = None) -> tuple[np.ndarray, np.ndarray]:
        """Calibrated probability and fairness flag in one pass (what the API needs per request).

        Xt, if given, must be X transformed by a pipeline equal to `shared_prep` (see same_prep)."""
        if self.kind != "exponentiated_gradient":
            return self.predict_proba(X), self.flag(X, sensitive)
        probs = self._member_probs(X, Xt)
        proba = self.mixture_calibrator.predict(sum(w * p for p, w in probs))
        # Fairlearn's _pmf_predict = sum of w * member.predict(X), and member.predict is proba >= 0.5
        pmf = sum(w * (p >= 0.5).astype(float) for p, w in probs)
        return proba, (row_uniform(X) < pmf).astype(int)

    # --- generic interface -------------------------------------------------------------------
    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        if self.kind == "exponentiated_gradient":
            return self.mixture_calibrator.predict(self.mixture_score(X))
        return self.calibrated.predict_proba(X)[:, 1]

    def decision_score(self, X: pd.DataFrame, sensitive=None) -> np.ndarray:
        if self.kind == "exponentiated_gradient":
            return sum(w * (p >= 0.5).astype(float) for p, w in self._member_probs(X))
        if self.kind == "threshold_optimizer":
            return self.mitigator._pmf_predict(X, sensitive_features=np.asarray(sensitive))[:, 1]
        return self.predict_proba(X)

    def flag(self, X: pd.DataFrame, sensitive=None) -> np.ndarray:
        if self.kind == "unconstrained":
            return (self.predict_proba(X) >= self.threshold).astype(int)
        if self.kind == "group_thresholds":
            return self.mitigator.predict(X, sensitive)
        return (row_uniform(X) < self.decision_score(X, sensitive)).astype(int)


def same_prep(a, b) -> bool:
    """True if two fitted build_pipeline() objects transform identically (same steps and fitted values)."""
    try:
        wa, wb, ia, ib = a.named_steps["winsor"], b.named_steps["winsor"], a.named_steps["impute"], b.named_steps["impute"]
        return ([n for n, _ in a.steps] == [n for n, _ in b.steps]
                and a.named_steps["sentinels"].sentinels == b.named_steps["sentinels"].sentinels
                and tuple(a.named_steps["age"].valid_range) == tuple(b.named_steps["age"].valid_range)
                and wa.lower_.equals(wb.lower_) and wa.upper_.equals(wb.upper_)
                and ia.medians_.equals(ib.medians_) and ia.indicator_cols_ == ib.indicator_cols_)
    except (AttributeError, KeyError):
        return False
