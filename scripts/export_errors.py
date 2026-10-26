import joblib
import pandas as pd

from src.config import path
from src.data.split import load_split


def main(n: int = 25, threshold: float = 0.5) -> None:
    model = joblib.load(path("models") / "calibrated_model.joblib")
    Xv, yv, _ = load_split("val")
    p = pd.Series(model.predict_proba(Xv)[:, 1], index=Xv.index)
    pred = (p >= threshold).astype(int)
    fp = p[(pred == 1) & (yv == 0)].sort_values(ascending=False).head(n // 2 + 1).index
    fn = p[(pred == 0) & (yv == 1)].sort_values().head(n - len(fp)).index
    rows = Xv.loc[fp.append(fn)].assign(actual=yv, probability=p.round(4), error=lambda d: d.actual.map({0: "FP", 1: "FN"}), notes="")
    rows.to_csv(path("reports") / "error_cases.csv")
    print(rows["error"].value_counts().to_dict())


if __name__ == "__main__":
    main()
