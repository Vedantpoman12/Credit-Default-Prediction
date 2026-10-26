import warnings

import numpy as np
import pandas as pd
from fairlearn.metrics import MetricFrame, count, false_positive_rate, selection_rate, true_positive_rate
from sklearn.metrics import precision_score

from src.config import CFG


def fairness_report(y: pd.Series, pred: np.ndarray, sensitive: pd.Series, min_n: int = CFG["fairness"]["min_group_n"]) -> tuple[pd.DataFrame, dict]:
    mf = MetricFrame(
        metrics={"selection_rate": selection_rate, "tpr": true_positive_rate, "fpr": false_positive_rate,
                 "precision": lambda a, b: precision_score(a, b, zero_division=0), "count": count},
        y_true=np.asarray(y), y_pred=np.asarray(pred), sensitive_features=np.asarray(sensitive),
    )
    groups = mf.by_group
    small = groups.index[groups["count"] < min_n].tolist()
    if small:
        warnings.warn(f"Groups with n < {min_n} are reported but excluded from gaps: {small}")
    g = groups[groups["count"] >= min_n]
    gaps = {
        "demographic_parity_gap": float(g["selection_rate"].max() - g["selection_rate"].min()),
        "tpr_gap": float(g["tpr"].max() - g["tpr"].min()),
        "fpr_gap": float(g["fpr"].max() - g["fpr"].min()),
    }
    gaps["equalized_odds_gap"] = max(gaps["tpr_gap"], gaps["fpr_gap"])
    gaps["equal_opportunity_gap"] = gaps["tpr_gap"]
    gaps["excluded_groups"] = small
    return groups, gaps
