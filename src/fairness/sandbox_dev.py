"""Fairness sandbox on the credit-approval dataset (explicit sex and age) with repeated stratified CV."""
import warnings

import numpy as np
import pandas as pd
from fairlearn.postprocessing import ThresholdOptimizer
from fairlearn.reductions import ErrorRate, ExponentiatedGradient, TruePositiveRateParity
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import RepeatedStratifiedKFold
from xgboost import XGBClassifier

from src.config import CFG, path
from src.data.load import age_band, load_sandbox
from src.fairness.metrics import fairness_report

SEED = CFG["seed"]
EPS = [0.01, 0.05]


def xgb(spw: float = 1.0) -> XGBClassifier:
    return XGBClassifier(n_estimators=150, max_depth=4, learning_rate=0.1, scale_pos_weight=spw, tree_method="hist", random_state=SEED, n_jobs=4)


def run(X: pd.DataFrame, y: pd.Series, s: pd.Series, attr: str) -> list[dict]:
    rows = []
    cv = RepeatedStratifiedKFold(n_splits=3, n_repeats=2, random_state=SEED)
    for fold, (tr, te) in enumerate(cv.split(X, y)):
        Xtr, Xte, ytr, yte, str_, ste = X.iloc[tr], X.iloc[te], y.iloc[tr], y.iloc[te], s.iloc[tr], s.iloc[te]
        spw = float((ytr == 0).sum() / (ytr == 1).sum())
        base = xgb(spw).fit(Xtr, ytr)
        p = base.predict_proba(Xte)[:, 1]
        preds = {"unconstrained": (p, (p >= 0.5).astype(int))}
        for eps in EPS:
            eg = ExponentiatedGradient(xgb(), TruePositiveRateParity(), objective=ErrorRate(costs={"fp": 1.0, "fn": spw}), eps=eps, max_iter=30)
            eg.fit(Xtr, ytr, sensitive_features=str_)
            pmf = eg._pmf_predict(Xte)[:, 1]
            preds[f"exp_grad_eps{eps}"] = (pmf, (pmf >= 0.5).astype(int))
        to = ThresholdOptimizer(estimator=base, constraints="true_positive_rate_parity", objective="balanced_accuracy_score", prefit=True, predict_method="predict_proba")
        to.fit(Xtr, ytr, sensitive_features=str_)
        pmf = to._pmf_predict(Xte, sensitive_features=ste)[:, 1]
        preds["threshold_optimizer"] = (pmf, (pmf >= 0.5).astype(int))
        for name, (score, flag) in preds.items():
            _, gaps = fairness_report(yte, flag, ste)
            rows.append({"attribute": attr, "fold": fold, "model": name, "auc": roc_auc_score(yte, score), **{k: v for k, v in gaps.items() if k != "excluded_groups"}})
    return rows


def main() -> None:
    warnings.filterwarnings("ignore", message="Groups with n")
    warnings.filterwarnings("ignore", category=FutureWarning)
    df = load_sandbox()
    y = df.pop("default")
    sensitive = {"SEX": df.pop("SEX"), "age_band": age_band(df.pop("AGE"))}
    X = pd.get_dummies(df, dtype=int)
    rows = []
    for attr, s in sensitive.items():
        rows += run(X, y, s, attr)
    res = pd.DataFrame(rows).groupby(["attribute", "model"]).agg(["mean", "std"]).drop(columns="fold").round(4)
    res.columns = ["_".join(c) for c in res.columns]
    res.to_csv(path("reports") / "sandbox_fairness.csv")
    print(res[["auc_mean", "tpr_gap_mean", "tpr_gap_std", "fpr_gap_mean"]].to_string())


if __name__ == "__main__":
    main()
