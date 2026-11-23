import joblib
import numpy as np

from src.config import path
from src.data.split import load_split


def test_risk_is_monotone_in_delays_and_payments():
    model = joblib.load(path("models") / "xgb_pipeline.joblib")
    X, _, _ = load_split("val")
    X = X.sample(500, random_state=0)
    base = model.predict_proba(X)[:, 1]
    for col in ["PAY_0", "PAY_2", "PAY_3", "PAY_4", "PAY_5", "PAY_6"]:
        later = model.predict_proba(X.assign(**{col: np.clip(X[col] + 1, -2, 9)}))[:, 1]
        assert (later >= base - 1e-6).all(), f"being later on {col} lowered risk"
    for col in ["PAY_AMT1", "PAY_AMT2", "PAY_AMT3"]:
        more_paid = model.predict_proba(X.assign(**{col: X[col] + 5000}))[:, 1]
        assert (more_paid <= base + 1e-6).all(), f"paying more on {col} raised risk"


def test_fast_policy_path_matches_fairlearn():
    """The one-transform scoring path must give exactly the probabilities and flags of the per-member/Fairlearn path."""
    from src.explain.shap_explain import ShapExplainer
    from src.fairness.policy import row_uniform, same_prep

    policy = joblib.load(path("models") / "policy.joblib")
    if policy.kind != "exponentiated_gradient":
        return
    X, _, _ = load_split("val")
    X = X.sample(500, random_state=1)
    eg = policy.mitigator
    slow_proba = policy.mixture_calibrator.predict(sum(w * eg.predictors_[i].predict_proba(X)[:, 1] for i, w in eg.weights_.items() if w > 0))
    slow_flag = (row_uniform(X) < eg._pmf_predict(X)[:, 1]).astype(int)
    explainer = ShapExplainer()
    assert policy.shared_prep is not None and same_prep(policy.shared_prep, explainer.prep)
    for proba, flag in (policy.score(X), policy.score(X, Xt=explainer.prepare(X)[1]), (policy.predict_proba(X), policy.flag(X))):
        np.testing.assert_array_equal(proba, slow_proba)
        np.testing.assert_array_equal(flag, slow_flag)
