import numpy as np
import pandas as pd
from scipy.stats import chi2_contingency

from src.config import CFG, path
from src.data.load import age_band, load_sandbox
from src.data.split import load_split

THRESHOLD = 0.4


def cramers_v(a: pd.Series, b: pd.Series) -> float:
    table = pd.crosstab(a, b)
    chi2 = chi2_contingency(table)[0]
    n, k = table.values.sum(), min(table.shape) - 1
    return float(np.sqrt(chi2 / (n * k))) if k else 0.0


def associations(X: pd.DataFrame, sensitive: pd.Series, name: str, dataset: str) -> list[dict]:
    rows = []
    for col in X.columns:
        if pd.api.types.is_numeric_dtype(X[col]) and X[col].nunique() > 10 and pd.api.types.is_numeric_dtype(sensitive):
            metric, value = "spearman", float(X[col].corr(sensitive, method="spearman"))
        else:
            binned = pd.qcut(X[col], 10, duplicates="drop") if pd.api.types.is_numeric_dtype(X[col]) and X[col].nunique() > 10 else X[col]
            metric, value = "cramers_v", cramers_v(binned.astype(str), sensitive.astype(str))
        flagged = abs(value) > THRESHOLD
        rows.append({"dataset": dataset, "sensitive": name, "feature": col, "metric": metric, "value": round(value, 4), "flagged": flagged,
                     "decision": "review / consider removal" if flagged else "keep",
                     "justification": f"|association| {'>' if flagged else '<='} {THRESHOLD}"})
    return rows


def main() -> None:
    X, _, sens = load_split("train")
    rows = associations(X, sens["AGE"], "AGE", "taiwan") + associations(X, sens["age_band"], "age_band", "taiwan")
    rows += associations(X, sens["SEX"], "SEX", "taiwan")
    sb = load_sandbox()
    sbX = sb.drop(columns=["default", "SEX", "AGE"])
    rows += associations(sbX, sb["SEX"], "SEX", "credit_approval_sandbox") + associations(sbX, sb["AGE"], "AGE", "credit_approval_sandbox")
    table = pd.DataFrame(rows)
    table.to_csv(path("reports") / "proxy_table.csv", index=False)
    print(table[table.flagged].to_string(index=False) if table.flagged.any() else "No feature exceeds |0.4|")
    print(table.loc[table.groupby(["dataset", "sensitive"])["value"].apply(lambda s: s.abs().idxmax())].to_string(index=False))


if __name__ == "__main__":
    main()
