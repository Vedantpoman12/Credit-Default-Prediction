import time

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import shap
import xgboost as xgb

from src.config import path
from src.features.pipeline import base_feature

FIG = path("figures")


class ShapExplainer:
    def __init__(self, model_path=None):
        pipe = joblib.load(model_path or path("models") / "xgb_pipeline.joblib")
        self.prep, self.model = pipe.named_steps["prep"], pipe.named_steps["xgb"]
        self.booster = self.model.get_booster()

    def contributions(self, X: pd.DataFrame) -> tuple[pd.DataFrame, float, pd.DataFrame]:
        """SHAP per input and engineered feature (sentinel/missing flags folded into their feature), plus their values."""
        features = self.prep.named_steps["features"].transform(X)
        Xt = self.prep.transform(X)
        contribs = self.booster.predict(xgb.DMatrix(Xt), pred_contribs=True)
        df = pd.DataFrame(contribs[:, :-1], columns=Xt.columns, index=X.index)
        return df.T.groupby(base_feature).sum().T[features.columns], float(contribs[0, -1]), features

    def top5_contributions(self, row: pd.DataFrame) -> tuple[list[dict], float]:
        start = time.perf_counter()
        contribs, _, features = self.contributions(row)
        s = contribs.iloc[0]
        top = s.reindex(s.abs().sort_values(ascending=False).index[:5])
        out = [{"feature": f, "value": round(float(features.iloc[0][f]), 4), "shap": round(float(v), 4)} for f, v in top.items()]
        return out, (time.perf_counter() - start) * 1000

    def explanation(self, X: pd.DataFrame) -> shap.Explanation:
        contribs, base, features = self.contributions(X)
        return shap.Explanation(contribs.to_numpy(), base_values=np.full(len(X), base), data=features.to_numpy(), feature_names=list(features.columns))

    def global_summary(self, X: pd.DataFrame) -> list[str]:
        exp = self.explanation(X)
        shap.plots.beeswarm(exp, max_display=15, show=False)
        plt.tight_layout(); plt.savefig(FIG / "shap_beeswarm.png", dpi=110); plt.close()
        shap.plots.bar(exp, max_display=15, show=False)
        plt.tight_layout(); plt.savefig(FIG / "shap_bar.png", dpi=110); plt.close()
        top4 = list(pd.Series(np.abs(exp.values).mean(0), index=exp.feature_names).sort_values(ascending=False).index[:4])
        for f in top4:
            shap.plots.scatter(exp[:, f], color=exp, show=False)
            plt.tight_layout(); plt.savefig(FIG / f"shap_dependence_{f}.png", dpi=110); plt.close()
        return top4

    def local_waterfall(self, row: pd.DataFrame, name: str) -> None:
        shap.plots.waterfall(self.explanation(row)[0], max_display=10, show=False)
        plt.tight_layout(); plt.savefig(FIG / f"shap_waterfall_{name}.png", dpi=110); plt.close()


def main() -> None:
    import warnings

    from src.api.policy import decide
    from src.data.split import load_split

    warnings.filterwarnings("ignore", category=FutureWarning)
    Xv, yv, sv = load_split("val")
    explainer = ShapExplainer()
    sample = Xv.sample(2000, random_state=42)
    print("top-4 global drivers:", explainer.global_summary(sample))
    policy = joblib.load(path("models") / "policy.joblib")
    p, flag = policy.predict_proba(Xv), policy.flag(Xv, sv["age_band"])
    decisions = pd.Series([decide(pi, fi)[1] for pi, fi in zip(p, flag)], index=Xv.index)
    print(decisions.value_counts().to_dict())
    for d in ("approve", "refer", "decline"):
        idx = decisions[decisions == d].index[0]
        explainer.local_waterfall(Xv.loc[[idx]], d)
        top5, ms = explainer.top5_contributions(Xv.loc[[idx]])
        print(d, idx, f"p={p[Xv.index.get_loc(idx)]:.3f}", f"{ms:.2f} ms", top5[:3])


if __name__ == "__main__":
    main()
