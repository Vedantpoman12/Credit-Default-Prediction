# %%
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

from src.config import CFG, path
from src.data.load import age_band, load_primary, load_sandbox

FIG = path("figures")
FIG.mkdir(parents=True, exist_ok=True)
df = load_primary()
sb = load_sandbox()
target = CFG["primary"]["target"]


def save(name: str) -> None:
    plt.tight_layout()
    plt.savefig(FIG / f"eda_{name}.png", dpi=110)
    plt.close()


# %% class balance
df[target].value_counts().sort_index().plot.bar(title=f"Class balance (default rate {df[target].mean():.3f})")
save("class_balance")

# %% missingness after sentinel decoding
sentinel_counts = {c: int(df[c].isin(v).sum()) for c, v in CFG["primary"]["sentinels"].items()}
missing = df.isna().sum().add(pd.Series(sentinel_counts), fill_value=0)
missing[missing > 0].plot.bar(title="Missing / undocumented values per column")
save("missingness")
print("Sentinel counts:", sentinel_counts)

# %% special codes in the three most recent repayment-status columns
pay_codes = pd.DataFrame({c: df[c].value_counts().reindex([-2, -1, 0]).fillna(0).astype(int) for c in ["PAY_0", "PAY_2", "PAY_3"]})
pay_codes.plot.bar(title="Special codes -2/-1/0 in PAY_0, PAY_2, PAY_3")
save("pay_special_codes")
print(pay_codes)

# %% age anomalies
lo, hi = CFG["age_bands"]["valid_range"]
age_anomalies = int((~df["AGE"].between(lo, hi)).sum())
df["AGE"].plot.hist(bins=40, title=f"Age distribution ({age_anomalies} outside {lo}-{hi})")
save("age")

# %% utilisation and bill outliers
util = df["BILL_AMT1"] / df["LIMIT_BAL"]
over_limit, negative_bill = int((util > 1).sum()), int((df["BILL_AMT1"] < 0).sum())
util.clip(-0.5, 2).plot.hist(bins=50, title=f"Utilisation BILL_AMT1/LIMIT_BAL (>1: {over_limit}, negative: {negative_bill})")
save("utilisation")
df[["BILL_AMT1", "PAY_AMT1", "LIMIT_BAL"]].plot.box(logy=False, title="Amount outliers")
save("amount_outliers")

# %% default rate by age band
df["age_band"] = age_band(df["AGE"])
by_age = df.groupby("age_band")[target].agg(["mean", "size"]).reindex(CFG["age_bands"]["labels"])
by_age["mean"].plot.bar(title="Default rate by age band")
save("default_by_age_band")
print(by_age)

# %% sandbox: default rate by sex and age band
sb["age_band"] = age_band(sb["AGE"])
fig, ax = plt.subplots(1, 2, figsize=(10, 4))
sb.groupby("SEX")["default"].mean().plot.bar(ax=ax[0], title="Sandbox default rate by sex")
sb.groupby("age_band")["default"].mean().reindex(CFG["age_bands"]["labels"]).plot.bar(ax=ax[1], title="Sandbox default rate by age band")
save("sandbox_by_sex_age")

# %% three data-quality issues
issues = pd.DataFrame([
    {"issue": "Undocumented category codes", "evidence": f"EDUCATION in {{0,5,6}}: {sentinel_counts['EDUCATION']}, MARRIAGE=0: {sentinel_counts['MARRIAGE']}",
     "remediation": "SentinelCleaner: set to NaN + flag, median-impute (fit on train)"},
    {"issue": "Balance above credit limit / negative bills", "evidence": f"BILL_AMT1/LIMIT_BAL > 1: {over_limit}; BILL_AMT1 < 0: {negative_bill}",
     "remediation": "Winsorizer with 1st/99th percentile caps learned on train only"},
    {"issue": "Small protected subgroup", "evidence": f"65+ band n={int(by_age.loc['65+', 'size'])} ({by_age.loc['65+', 'size'] / len(df):.2%})",
     "remediation": "Warn when n<30 per split; report but exclude from gap gate"},
])
issues.to_csv(path("reports") / "data_quality_issues.csv", index=False)
print(issues.to_string(index=False))
