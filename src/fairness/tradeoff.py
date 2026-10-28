import json
import warnings

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

from src.config import path
from src.data.split import load_split
from src.fairness.apply_primary import CANDIDATES, evaluate_policy


def main() -> None:
    warnings.filterwarnings("ignore", category=FutureWarning)
    Xv, yv, sv = load_split("val")
    rows = []
    for f in sorted(CANDIDATES.glob("*.joblib")):
        r = evaluate_policy(joblib.load(f), Xv, yv, sv)
        rows.append({"model": f.stem, "family": {"unconstrained": "unconstrained", "exponentiated_gradient": "reduction", "threshold_optimizer": "post-processing", "group_thresholds": "post-processing"}[r["kind"]],
                     "roc_auc": r["roc_auc"], "pr_auc": r["pr_auc"], "f1": r["f1"], "tpr_gap": r["tpr_gap"], "fpr_gap": r["fpr_gap"],
                     "selection_rate_gap": r["demographic_parity_gap"]})
    table = pd.DataFrame(rows).round(4)
    table["deployed"] = table["model"] == json.loads((path("reports") / "fairness_candidates.json").read_text())["selected"]
    table.to_csv(path("reports") / "tradeoff_table.csv", index=False)

    fig, ax = plt.subplots(figsize=(7, 5))
    for fam, g in table.groupby("family"):
        ax.scatter(g["tpr_gap"], g["f1"], s=70, label=fam)
        for _, r in g.iterrows():
            ax.annotate(r["model"], (r["tpr_gap"], r["f1"]), fontsize=7, xytext=(4, 3), textcoords="offset points")
    ax.axvline(0.05, ls="--", c="r", label="TPR gap target 0.05")
    ax.set(xlabel="Equal-opportunity (TPR) gap across age bands", ylabel="F1 (validation)", title="Fairness-performance trade-off frontier")
    ax.legend()
    fig.tight_layout()
    fig.savefig(path("reports") / "tradeoff_frontier.png", dpi=110)
    print(table.to_string(index=False))


if __name__ == "__main__":
    main()
