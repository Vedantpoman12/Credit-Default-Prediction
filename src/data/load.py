import numpy as np
import pandas as pd

from src.config import CFG, path


def age_band(age: pd.Series) -> pd.Series:
    lo, hi = CFG["age_bands"]["valid_range"]
    age = age.where(age.between(lo, hi))
    bands = pd.cut(age, CFG["age_bands"]["edges"], right=False, labels=CFG["age_bands"]["labels"])
    return bands.astype(str).replace("nan", "unknown")


def load_primary() -> pd.DataFrame:
    df = pd.read_csv(path("raw") / CFG["primary"]["file"], header=1)
    return df.rename(columns={"default payment next month": CFG["primary"]["target"]}).drop(columns="ID")


def load_sandbox() -> pd.DataFrame:
    raw = path("raw")
    app = pd.read_csv(raw / CFG["sandbox"]["application"]).drop_duplicates("ID")
    credit = pd.read_csv(raw / CFG["sandbox"]["credit"])
    label = credit["STATUS"].astype(str).isin(CFG["sandbox"]["default_status"]).groupby(credit["ID"]).max()
    df = app.merge(label.rename("default").astype(int), left_on="ID", right_index=True)
    df["SEX"] = df.pop("CODE_GENDER")
    df["AGE"] = (-df.pop("DAYS_BIRTH") / 365.25).round(1)
    df["DAYS_EMPLOYED"] = df["DAYS_EMPLOYED"].where(df["DAYS_EMPLOYED"] <= 0, np.nan)
    df["OCCUPATION_TYPE"] = df["OCCUPATION_TYPE"].fillna("Unknown")
    return df.drop(columns=["ID", "FLAG_MOBIL"]).reset_index(drop=True)
