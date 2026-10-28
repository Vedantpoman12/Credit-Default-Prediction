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
