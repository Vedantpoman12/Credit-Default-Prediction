from dataclasses import dataclass

from src.config import CFG


@dataclass(frozen=True)
class DecisionThresholds:
    refer_low: float = CFG["policy"]["refer_low"]
    refer_high: float = CFG["policy"]["refer_high"]


def risk_band(probability: float, t: DecisionThresholds = DecisionThresholds()) -> str:
    if probability < t.refer_low:
        return "low"
    return "medium" if probability < t.refer_high else "high"


def decide(probability: float, flagged: int, t: DecisionThresholds = DecisionThresholds()) -> tuple[str, str, bool]:
    """Combine the fairness-constrained flag with the calibrated probability into approve/refer/decline."""
    band = risk_band(probability, t)
    if flagged:
        decision = "decline" if band == "high" else "refer"
    else:
        decision = "approve" if band == "low" else "refer"
    return band, decision, decision == "refer"
