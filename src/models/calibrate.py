import json

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import mlflow
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.frozen import FrozenEstimator
from sklearn.metrics import brier_score_loss
from sklearn.model_selection import StratifiedKFold, cross_val_predict

from src.config import CFG, path
from src.data.split import load_split
from src.models.metrics import ece
from src.models.train_baselines import setup_mlflow


def main() -> None:
    setup_mlflow()
    bins = CFG["calibration"]["ece_bins"]
    model = joblib.load(path("models") / "xgb_pipeline.joblib")
    Xv, yv, _ = load_split("val")
    probs = {"uncalibrated": model.predict_proba(Xv)[:, 1]}
    calibrated = {}
    for method in ("isotonic", "sigmoid"):
        calibrated[method] = CalibratedClassifierCV(FrozenEstimator(model), method=method).fit(Xv, yv)
        probs[method] = calibrated[method].predict_proba(Xv)[:, 1]
        cv = StratifiedKFold(5, shuffle=True, random_state=CFG["seed"])
        probs[f"{method}_oof"] = cross_val_predict(CalibratedClassifierCV(FrozenEstimator(model), method=method), Xv, yv, cv=cv, method="predict_proba")[:, 1]
    results = {k: {"ece": ece(yv, p, bins), "brier": brier_score_loss(yv, p)} for k, p in probs.items()}
    non_degenerate = [m for m in calibrated if 0 < probs[m].min() and probs[m].max() < 1] or list(calibrated)
    best = min(non_degenerate, key=lambda m: results[f"{m}_oof"]["ece"])
    joblib.dump(calibrated[best], path("models") / "calibrated_model.joblib")

    fig, ax = plt.subplots(figsize=(6, 6))
    ax.plot([0, 1], [0, 1], "k--", label="perfect")
    for k, p in probs.items():
        if k.endswith("_oof"):
            continue
        frac, mean = calibration_curve(yv, p, n_bins=bins, strategy="quantile")
        ax.plot(mean, frac, marker="o", label=f"{k} (ECE {results[k]['ece']:.3f})")
    ax.set(xlabel="Mean predicted probability", ylabel="Observed default rate", title="Reliability diagram (validation)")
    ax.legend()
    fig.savefig(path("figures") / "reliability_diagram.png", dpi=110)

    summary = {"selected": best, "results": results}
    (path("reports") / "calibration.json").write_text(json.dumps(summary, indent=2))
    with mlflow.start_run(run_name="calibration"):
        mlflow.log_param("selected_method", best)
        for k, r in results.items():
            mlflow.log_metrics({f"{k}_ece": r["ece"], f"{k}_brier": r["brier"]})
        mlflow.log_artifact(str(path("figures") / "reliability_diagram.png"))
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
