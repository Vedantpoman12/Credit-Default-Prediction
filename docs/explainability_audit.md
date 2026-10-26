# Explainability Audit

> Educational artefact, not for real lending decisions.

Global SHAP (`reports/figures/shap_bar.png`, `shap_beeswarm.png`) on 2,000 validation rows.

| Rank | Feature | Direction in SHAP | Credit-domain intuition | Surprise? |
|---|---|---|---|---|
| 1 | PAY_0 (latest repayment status) | Months of delay sharply raise risk | Recent delinquency is the strongest predictor | No |
| 2 | LIMIT_BAL (credit limit) | Higher limit lowers risk | Banks give higher limits to stronger customers | No, but it carries the bank's own past judgement (feedback loop) |
| 3 | PAY_2 (status 2 months ago) | Delay raises risk | Persistent delinquency | No |
| 4 | BILL_AMT1 (latest bill) | Mixed effect | Bills alone are ambiguous without the limit | Mild: weaker than expected; utilisation would be clearer |
| - | PAY_0 = -2 / -1 | Lower risk than 0 (revolving) | "No consumption" / "paid in full" | Codes are undocumented in the original codebook |

Local waterfalls: `shap_waterfall_approve.png` (p=0.187), `shap_waterfall_refer.png` (p=0.301), `shap_waterfall_decline.png` (p=0.607).

**DiCE recourse** (`src/explain/recourse_dice.py`): for the first declined validation applicant, 3 of 3 counterfactuals flip the full policy decision to *approve*. Each one brings PAY_0 to -1 (paid duly) and raises one recent payment (e.g. PAY_AMT1 5,000 -> 13,169). Age is locked as immutable.

**How SHAP relates to the final score.** SHAP explains the raw XGBoost log-odds. The returned probability is an isotonic (monotone) recalibration of that score, so features that push risk up still push it up, but SHAP values do not add up to the calibrated probability. The decision also depends on an age-band-specific threshold, which SHAP does not show. Suggested wording: *"These factors explain the model's risk score. The final decision also applies a calibrated probability scale and a fairness adjustment by age band."*
