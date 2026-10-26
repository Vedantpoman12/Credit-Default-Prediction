"""One-time evaluation on the frozen test split. Refuses to run twice."""
import json
import subprocess
import sys
from datetime import datetime, timezone

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from sklearn.calibration import calibration_curve
from sklearn.metrics import average_precision_score, brier_score_loss, f1_score, precision_score, recall_score, roc_auc_score

from src.api.policy import decide
from src.config import CFG, path
from src.data.split import _read
from src.fairness.metrics import fairness_report
from src.models.metrics import bootstrap_ci, ece

LOCK = path("reports") / "final_test.lock"


def main() -> None:
    if LOCK.exists():
        sys.exit(f"Refusing to run: test set already evaluated ({LOCK.read_text().strip()})")
    info = json.loads((path("models") / "model_info.json").read_text())
    commit = subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()
    LOCK.write_text(json.dumps({"timestamp": datetime.now(timezone.utc).isoformat(), "git_commit": commit, "model_version": info["model_version"]}))

    X, y, s = _read("test")
    n, bins = CFG["bootstrap"]["n_samples"], CFG["calibration"]["ece_bins"]
    policy = joblib.load(path("models") / "policy.joblib")
    p = policy.predict_proba(X)
    flag = policy.flag(X, s["age_band"])
    decisions = [decide(pi, fi)[1] for pi, fi in zip(p, flag)]
    groups, gaps = fairness_report(y, flag, s["age_band"])

    selected = json.loads((path("reports") / "fairness_candidates.json").read_text())["results"]
    best_eg = max((k for k in selected if k.startswith("exp_grad") and (path("models") / "candidates" / f"{k}.joblib").exists()),
                  key=lambda k: selected[k]["roc_auc"])
    comparison = {}
    for name in ("unconstrained", best_eg, "threshold_optimizer"):
        cand = joblib.load(path("models") / "candidates" / f"{name}.joblib")
        _, g = fairness_report(y, cand.flag(X, s["age_band"]), s["age_band"])
        comparison[name] = {"roc_auc": roc_auc_score(y, cand.predict_proba(X)), "equal_opportunity_gap": g["tpr_gap"], "equalized_odds_gap": g["equalized_odds_gap"]}

    results = {
        "lock": json.loads(LOCK.read_text()), "n_test": int(len(y)), "default_rate": float(y.mean()), "deployed_policy": policy.kind,
        "roc_auc": bootstrap_ci(roc_auc_score, y, p, n), "pr_auc": bootstrap_ci(average_precision_score, y, p, n),
        "f1": f1_score(y, flag), "precision": precision_score(y, flag), "recall": recall_score(y, flag),
        "ece": ece(y, p, bins), "brier": brier_score_loss(y, p),
        "decision_mix": {d: decisions.count(d) for d in ("approve", "refer", "decline")},
        "fairness_by_age_band": groups.round(4).to_dict(orient="index"), "fairness_gaps": gaps, "model_comparison": comparison,
    }
    (path("reports") / "final_results.json").write_text(json.dumps(results, indent=2, default=float))

    fig, ax = plt.subplots(1, 2, figsize=(12, 4.5))
    frac, mean = calibration_curve(y, p, n_bins=10, strategy="quantile")
    ax[0].plot([0, 1], [0, 1], "k--"); ax[0].plot(mean, frac, marker="o")
    ax[0].set(title=f"Test reliability (ECE {results['ece']:.3f})", xlabel="predicted", ylabel="observed")
    groups["tpr"].plot.bar(ax=ax[1], title=f"Test TPR by age band (gap {gaps['tpr_gap']:.3f})")
    fig.tight_layout(); fig.savefig(path("figures") / "final_test_results.png", dpi=110)
    print(json.dumps({k: results[k] for k in ("roc_auc", "pr_auc", "f1", "ece", "brier", "decision_mix", "model_comparison")}, indent=2, default=float))
    print("fairness gaps:", gaps)


if __name__ == "__main__":
    main()
