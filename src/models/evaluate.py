"""Validation-only evaluation of the calibrated model."""
import json

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import average_precision_score, confusion_matrix, precision_recall_fscore_support, roc_auc_score

from src.config import CFG, path
from src.data.split import load_split
from src.models.metrics import bootstrap_ci

THRESHOLDS = [0.2, 0.3, 0.4, 0.5, 0.6]


def threshold_table(y: np.ndarray, p: np.ndarray, thresholds: list[float]) -> list[dict]:
    rows = []
    for t in thresholds:
        pred = (p >= t).astype(int)
        prec, rec, f1, _ = precision_recall_fscore_support(y, pred, average="binary", zero_division=0)
        tn, fp, fn, tp = confusion_matrix(y, pred).ravel()
        rows.append({"threshold": t, "precision": prec, "recall": rec, "f1": f1, "tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)})
    return rows


def main(fp_cost: float = CFG["costs"]["false_positive"], fn_cost: float = CFG["costs"]["false_negative"]) -> None:
    model = joblib.load(path("models") / "calibrated_model.joblib")
    Xv, yv, _ = load_split("val")
    y, p = yv.to_numpy(), model.predict_proba(Xv)[:, 1]
    n = CFG["bootstrap"]["n_samples"]
    roc = bootstrap_ci(roc_auc_score, y, p, n)
    pr = bootstrap_ci(average_precision_score, y, p, n)
    table = threshold_table(y, p, THRESHOLDS)

    grid = np.linspace(0.05, 0.95, 91)
    sweep = threshold_table(y, p, list(grid))
    f1s = np.array([r["f1"] for r in sweep])
    band = grid[f1s >= f1s.max() - 0.01]
    costs = np.array([fp_cost * r["fp"] + fn_cost * r["fn"] for r in sweep]) / len(y)

    fig, ax = plt.subplots(1, 3, figsize=(16, 4.5))
    ax[0].plot(grid, f1s, label="F1")
    ax[0].plot(grid, [r["precision"] for r in sweep], label="precision")
    ax[0].plot(grid, [r["recall"] for r in sweep], label="recall")
    ax[0].axvspan(band.min(), band.max(), alpha=0.2, label="F1 within 0.01 of max")
    ax[0].set(title="Threshold sensitivity", xlabel="threshold")
    ax[0].legend()
    ax[1].plot(grid, costs)
    ax[1].axvline(grid[costs.argmin()], ls="--", c="r")
    ax[1].set(title=f"Expected cost per applicant (FP={fp_cost}, FN={fn_cost})", xlabel="threshold")
    cm = confusion_matrix(y, (p >= 0.5).astype(int))
    ax[2].imshow(cm, cmap="Blues")
    for (i, j), v in np.ndenumerate(cm):
        ax[2].text(j, i, v, ha="center", va="center")
    ax[2].set(title="Confusion matrix @0.5", xlabel="predicted", ylabel="actual", xticks=[0, 1], yticks=[0, 1])
    fig.tight_layout()
    fig.savefig(path("figures") / "validation_evaluation.png", dpi=110)

    out = {"roc_auc": roc, "pr_auc": pr, "thresholds": table, "f1_stable_band": [float(band.min()), float(band.max())],
           "cost_optimal_threshold": float(grid[costs.argmin()])}
    (path("reports") / "validation_metrics.json").write_text(json.dumps(out, indent=2))
    print(f"ROC-AUC {roc[0]:.4f} [{roc[1]:.4f}, {roc[2]:.4f}]  PR-AUC {pr[0]:.4f} [{pr[1]:.4f}, {pr[2]:.4f}]")
    for r in table:
        print({k: round(v, 3) if isinstance(v, float) else v for k, v in r.items()})


if __name__ == "__main__":
    main()
