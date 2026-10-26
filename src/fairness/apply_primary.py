"""Fairness mitigation on the primary dataset with age bands; every selection uses the validation split only."""
import argparse
import json
import warnings

import joblib
import numpy as np
from fairlearn.postprocessing import ThresholdOptimizer
from fairlearn.reductions import ErrorRate, ExponentiatedGradient, TruePositiveRateParity
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import average_precision_score, f1_score, roc_auc_score

from src.config import CFG, path
from src.data.split import load_split
from src.fairness.metrics import fairness_report
from src.fairness.policy import FairPolicy, XGBPipelineClassifier
from src.models.metrics import ece

CANDIDATES = path("models") / "candidates"
MAX_GAP = 0.05


def evaluate_policy(policy: FairPolicy, X, y, sens) -> dict:
    p = policy.predict_proba(X)
    flag = policy.flag(X, sens["age_band"])
    _, gaps = fairness_report(y, flag, sens["age_band"])
    return {"kind": policy.kind, "roc_auc": roc_auc_score(y, p), "pr_auc": average_precision_score(y, p), "f1": f1_score(y, flag),
            "ece": ece(y, p, CFG["calibration"]["ece_bins"]), **gaps}


def build_candidates(X, y, sens, Xv, yv, sv) -> dict[str, FairPolicy]:
    calibrated = joblib.load(path("models") / "calibrated_model.joblib")
    params = joblib.load(path("models") / "xgb_params.joblib")
    spw = params["scale_pos_weight"]
    threshold = 1 / (1 + spw)
    out = {"unconstrained": FairPolicy("unconstrained", calibrated, threshold=threshold)}
    for eps in CFG["fairness"]["eps_grid"]:
        eg = ExponentiatedGradient(XGBPipelineClassifier(params["params"], CFG["seed"]), TruePositiveRateParity(),
                                   objective=ErrorRate(costs={"fp": 1.0, "fn": spw}), eps=eps, max_iter=CFG["fairness"]["max_iter"])
        eg.fit(X, y, sensitive_features=sens["age_band"])
        policy = FairPolicy("exponentiated_gradient", calibrated, mitigator=eg)
        policy.mixture_calibrator = IsotonicRegression(out_of_bounds="clip", y_min=0, y_max=1).fit(policy.mixture_score(Xv), yv)
        out[f"exp_grad_eps{eps}"] = policy
    raw = joblib.load(path("models") / "xgb_pipeline.joblib")
    to = ThresholdOptimizer(estimator=raw, constraints="true_positive_rate_parity", objective="balanced_accuracy_score",
                            prefit=True, predict_method="predict_proba")
    to.fit(Xv, yv, sensitive_features=sv["age_band"])
    out["threshold_optimizer"] = FairPolicy("threshold_optimizer", calibrated, mitigator=to)
    return out


def select(results: dict[str, dict], skip_mitigation: bool) -> str:
    if skip_mitigation:
        return "unconstrained"
    eg = {k: r for k, r in results.items() if k.startswith("exp_grad") and r["tpr_gap"] <= MAX_GAP}
    if eg:
        return max(eg, key=lambda k: eg[k]["roc_auc"])
    return "threshold_optimizer"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--skip-mitigation", action="store_true", help="deploy the unconstrained model (failing-gate demo)")
    args = ap.parse_args()
    warnings.filterwarnings("ignore", category=FutureWarning)
    np.random.seed(CFG["seed"])
    X, y, sens = load_split("train")
    Xv, yv, sv = load_split("val")
    CANDIDATES.mkdir(parents=True, exist_ok=True)
    candidates = build_candidates(X, y, sens, Xv, yv, sv)
    results = {}
    for name, policy in candidates.items():
        joblib.dump(policy, CANDIDATES / f"{name}.joblib")
        results[name] = evaluate_policy(policy, Xv, yv, sv)
        print(f"{name:24s} AUC {results[name]['roc_auc']:.4f}  F1 {results[name]['f1']:.4f}  TPR gap {results[name]['tpr_gap']:.4f}  ECE {results[name]['ece']:.4f}")
    chosen = select(results, args.skip_mitigation)
    joblib.dump(candidates[chosen], path("models") / "policy.joblib")
    (path("reports") / "fairness_candidates.json").write_text(json.dumps({"selected": chosen, "results": results}, indent=2))
    print("deployed policy:", chosen)


if __name__ == "__main__":
    main()
