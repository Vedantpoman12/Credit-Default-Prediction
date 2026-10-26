"""Simulate (a) an income-proxy shift and (b) a base-rate rise; report PSI, AUC, fairness gap and decline rate."""
import json

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score

from src.api.policy import decide
from src.config import CFG, path
from src.data.split import load_split
from src.fairness.metrics import fairness_report
from src.monitoring.psi import categorical_psi, psi, psi_table

INCOME_PROXY = ["LIMIT_BAL", "PAY_AMT1", "PAY_AMT2", "PAY_AMT3", "PAY_AMT4", "PAY_AMT5", "PAY_AMT6"]
TARGET_RATE = 0.40


def income_shift(X: pd.DataFrame, severity: float) -> pd.DataFrame:
    return X.assign(**{c: X[c] * (1 - 0.5 * severity) for c in INCOME_PROXY})


def base_rate_rise(X: pd.DataFrame, y: pd.Series, s: pd.DataFrame, rate: float, seed: int) -> tuple:
    rng = np.random.default_rng(seed)
    pos, neg = y.index[y == 1], y.index[y == 0]
    n_pos = int(rate * len(neg) / (1 - rate))
    idx = np.concatenate([neg, rng.choice(pos, n_pos, replace=True)])
    return X.loc[idx].reset_index(drop=True), y.loc[idx].reset_index(drop=True), s.loc[idx].reset_index(drop=True)


def assess(policy, X, y, s, ref_X, ref_p, ref_y) -> dict:
    p = policy.predict_proba(X)
    flag = policy.flag(X, s["age_band"])
    decisions = [decide(pi, fi)[1] for pi, fi in zip(p, flag)]
    table = psi_table(ref_X, X)
    _, gaps = fairness_report(y, flag, s["age_band"])
    label_psi = categorical_psi(ref_y, y)
    score_psi = psi(ref_p, p)
    return {"flagged": bool(table.psi.max() >= 0.1 or score_psi >= 0.1 or label_psi >= 0.1), "label_psi": label_psi, "max_feature_psi": float(table.psi.max()), "top_feature": table.iloc[0]["feature"], "flagged_features": table[table.status != "ok"]["feature"].tolist(),
            "score_psi": score_psi, "roc_auc": roc_auc_score(y, p), "tpr_gap": gaps["tpr_gap"], "default_rate": float(y.mean()),
            "decline_rate": float(np.mean([d == "decline" for d in decisions]))}


def main() -> None:
    seed = CFG["seed"]
    policy = joblib.load(path("models") / "policy.joblib")
    X, y, s = load_split("val")
    ref_p = policy.predict_proba(X)
    results = {"baseline": assess(policy, X, y, s, X, ref_p, y),
               "income_shift": assess(policy, income_shift(X, 1.0), y, s, X, ref_p, y),
               "base_rate_rise": assess(policy, *base_rate_rise(X, y, s, TARGET_RATE, seed), X, ref_p, y)}
    trend = []
    for sev in np.linspace(0, 1, 6):
        trend.append({"severity": sev, "income_shift": assess(policy, income_shift(X, sev), y, s, X, ref_p, y)["decline_rate"],
                      "base_rate_rise": assess(policy, *base_rate_rise(X, y, s, y.mean() + sev * (TARGET_RATE - y.mean()), seed), X, ref_p, y)["decline_rate"]})
    results["decline_rate_trend"] = trend
    out = path("reports") / "drift"
    (out / "inject_drift.json").write_text(json.dumps(results, indent=2, default=float))
    t = pd.DataFrame(trend).set_index("severity")
    t.plot(marker="o", title="Decline rate as drift severity increases", ylabel="decline rate")
    plt.tight_layout(); plt.savefig(out / "decline_rate_trend.png", dpi=110)
    print(pd.DataFrame({k: v for k, v in results.items() if k != "decline_rate_trend"}).T.to_string())


if __name__ == "__main__":
    main()
