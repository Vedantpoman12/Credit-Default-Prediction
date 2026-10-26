"""CI gates: performance (ROC-AUC) and fairness (equal-opportunity TPR gap) on the frozen validation split."""
import argparse
import json
import random
import sys

import joblib
import numpy as np
from sklearn.metrics import roc_auc_score

from src.config import ROOT, load_config, path
from src.data.split import load_split
from src.fairness.metrics import fairness_report
from src.models.model_info import INFO


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--candidate", default=str(path("models") / "policy.joblib"))
    ap.add_argument("--gate", choices=["performance", "fairness", "all"], default="all")
    args = ap.parse_args()
    gates = load_config("gates.yaml")
    random.seed(gates["seed"])
    np.random.seed(gates["seed"])

    policy = joblib.load(args.candidate)
    X, y, s = load_split("val")
    auc = float(roc_auc_score(y, policy.predict_proba(X)))
    groups, gaps = fairness_report(y, policy.flag(X, s["age_band"]), s["age_band"])
    results = {
        "candidate": args.candidate, "policy_kind": policy.kind,
        "performance_gate": {"roc_auc": auc, "threshold": gates["min_auc"], "passed": auc >= gates["min_auc"]},
        "fairness_gate": {"tpr_gap": gaps["tpr_gap"], "threshold": gates["max_tpr_gap"], "passed": gaps["tpr_gap"] <= gates["max_tpr_gap"],
                          "excluded_small_groups": gaps["excluded_groups"], "tpr_by_group": groups["tpr"].round(4).to_dict()},
    }
    out = ROOT / "metrics"
    out.mkdir(exist_ok=True)
    (out / "gate_results.json").write_text(json.dumps(results, indent=2))
    if INFO.exists() and args.candidate == str(path("models") / "policy.joblib"):
        info = json.loads(INFO.read_text())
        info["fairness_gates"] = {k: results[k] for k in ("performance_gate", "fairness_gate")}
        INFO.write_text(json.dumps(info, indent=2))

    checks = {"performance": results["performance_gate"], "fairness": results["fairness_gate"]}
    selected = checks if args.gate == "all" else {args.gate: checks[args.gate]}
    for name, r in selected.items():
        metric = "roc_auc" if name == "performance" else "tpr_gap"
        print(f"{name.upper()} GATE: {metric}={r[metric]:.4f} (threshold {r['threshold']}) -> {'PASS' if r['passed'] else 'FAIL'}")
    sys.exit(0 if all(r["passed"] for r in selected.values()) else 1)


if __name__ == "__main__":
    main()
