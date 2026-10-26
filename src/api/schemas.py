from typing import Literal

from pydantic import BaseModel, Field

AgeBand = Literal["<25", "25-34", "35-44", "45-54", "55-64", "65+"]
Amount = Field(ge=-1_000_000, le=10_000_000)
Status = Field(ge=-2, le=9)


class ScoreRequest(BaseModel):
    LIMIT_BAL: float = Field(gt=0, le=10_000_000, description="Credit limit (NT$)")
    EDUCATION: int = Field(ge=0, le=6)
    MARRIAGE: int = Field(ge=0, le=3)
    PAY_0: int = Status
    PAY_2: int = Status
    PAY_3: int = Status
    PAY_4: int = Status
    PAY_5: int = Status
    PAY_6: int = Status
    BILL_AMT1: float = Amount
    BILL_AMT2: float = Amount
    BILL_AMT3: float = Amount
    BILL_AMT4: float = Amount
    BILL_AMT5: float = Amount
    BILL_AMT6: float = Amount
    PAY_AMT1: float = Field(ge=0, le=10_000_000)
    PAY_AMT2: float = Field(ge=0, le=10_000_000)
    PAY_AMT3: float = Field(ge=0, le=10_000_000)
    PAY_AMT4: float = Field(ge=0, le=10_000_000)
    PAY_AMT5: float = Field(ge=0, le=10_000_000)
    PAY_AMT6: float = Field(ge=0, le=10_000_000)
    age_band: AgeBand | None = Field(None, description="Used only for the fairness threshold lookup, never as a model feature")


class Contribution(BaseModel):
    feature: str
    value: float
    shap: float


class ScoreResponse(BaseModel):
    default_probability: float
    band: Literal["low", "medium", "high"]
    decision: Literal["approve", "refer", "decline"]
    requires_human_review: bool
    top5_shap: list[Contribution]
    model_version: str
    policy_version: str


class RecourseResponse(BaseModel):
    original_decision: str
    counterfactuals: list[dict]
    message: str
