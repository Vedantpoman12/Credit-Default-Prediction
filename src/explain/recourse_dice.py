import warnings

import dice_ml
from raiutils.exceptions import UserConfigValidationException
import joblib
import numpy as np
import pandas as pd

from src.api.policy import decide
from src.config import CFG, path
from src.data.load import age_band

FEATURES = CFG["primary"]["features"]
IMMUTABLE = ["AGE"]
ACTIONABLE = ["PAY_0", "BILL_AMT1", "PAY_AMT1", "PAY_AMT2", "PAY_AMT3"]


class PolicyModel:
    """Wraps the full deployed decision policy; class 1 = not approved, class 0 = approved."""

    def __init__(self, policy):
        self.policy = policy

    def decisions(self, X: pd.DataFrame) -> list[str]:
        Xf = X[FEATURES].astype(float)
        p = self.policy.predict_proba(Xf)
        flag = self.policy.flag(Xf, age_band(X["AGE"].astype(float)).to_numpy())
        return [decide(pi, fi)[1] for pi, fi in zip(p, flag)]

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        not_approved = np.array([d != "approve" for d in self.decisions(X)], dtype=float)
        return np.column_stack([1 - not_approved, not_approved])

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        return self.predict_proba(X)[:, 1].astype(int)


def permitted_ranges(row: pd.Series) -> dict[str, list[float]]:
    return {
        "PAY_0": [-2, float(row["PAY_0"])],
        "BILL_AMT1": [0.0, max(float(row["BILL_AMT1"]), 0.0)],
        **{f: [float(row[f]), float(row[f]) * 3 + 20000] for f in ["PAY_AMT1", "PAY_AMT2", "PAY_AMT3"]},
    }


def recourse(applicant: pd.DataFrame, reference: pd.DataFrame, policy=None, n: int = 3) -> dict:
    """applicant/reference: FEATURES + AGE + SEX columns. Returns verified counterfactuals and a message."""
    warnings.filterwarnings("ignore")
    model = PolicyModel(policy or joblib.load(path("models") / "policy.joblib"))
    data = reference[FEATURES + IMMUTABLE].astype(float).assign(outcome=model.predict(reference))
    d = dice_ml.Data(dataframe=data, continuous_features=FEATURES + IMMUTABLE, outcome_name="outcome")
    m = dice_ml.Model(model=model, backend="sklearn")
    exp = dice_ml.Dice(d, m, method="random")
    query = applicant[FEATURES + IMMUTABLE].astype(float)
    try:
        res = exp.generate_counterfactuals(query, total_CFs=n, desired_class=0, features_to_vary=ACTIONABLE,
                                           permitted_range=permitted_ranges(query.iloc[0]), random_seed=CFG["seed"])
        cfs = res.cf_examples_list[0].final_cfs_df
    except UserConfigValidationException:
        cfs = None
    if cfs is None or cfs.empty:
        return {"original_decision": model.decisions(query)[0], "counterfactuals": [], "message": "No actionable change found."}
    cfs = cfs.drop(columns="outcome").round(0)
    verified = model.decisions(cfs)
    out = []
    for (_, cf), dec in zip(cfs.iterrows(), verified):
        changes = {f: {"from": float(query.iloc[0][f]) + 0.0, "to": float(cf[f]) + 0.0} for f in ACTIONABLE if not np.isclose(cf[f], query.iloc[0][f])}
        assert all(np.isclose(cf[f], query.iloc[0][f]) for f in IMMUTABLE)
        out.append({"changes": changes, "new_decision": dec, "verified_flip": dec == "approve"})
    best = next((c for c in out if c["verified_flip"]), None)
    msg = "No verified counterfactual." if best is None else "You would likely be approved if you: " + "; ".join(
        f"change {k} from {v['from']:,.0f} to {v['to']:,.0f}" for k, v in best["changes"].items()) + ". Age was not changed."
    return {"original_decision": model.decisions(query)[0], "counterfactuals": out, "message": msg}


def main() -> None:
    from src.data.split import load_split

    Xv, _, sv = load_split("val")
    full = Xv.join(sv[IMMUTABLE])
    model = PolicyModel(joblib.load(path("models") / "policy.joblib"))
    dec = pd.Series(model.decisions(full), index=full.index)
    only_latest_late = (full["PAY_0"] > 0) & (full[["PAY_2", "PAY_3", "PAY_4", "PAY_5", "PAY_6"]] <= 0).all(axis=1)
    applicant = full.loc[[dec[(dec == "decline") & only_latest_late].index[0]]]
    result = recourse(applicant, full.sample(2000, random_state=CFG["seed"]))
    print("original:", result["original_decision"])
    for c in result["counterfactuals"]:
        print(c)
    print(result["message"])


if __name__ == "__main__":
    main()
