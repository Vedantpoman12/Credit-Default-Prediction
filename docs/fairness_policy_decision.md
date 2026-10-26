# Fairness Policy Decision

> Educational artefact, not for real lending decisions.

**Criterion:** equal opportunity (equal TPR across age bands = defaulters are caught at the same rate in every age band), target gap <= 0.05.

**Validation results** (reports/tradeoff_table.csv)

| Model | Family | ROC-AUC | F1 | TPR gap | FPR gap |
|---|---|---|---|---|---|
| Unconstrained XGBoost | none | 0.7858 | 0.5438 | 0.1175 | 0.0748 |
| ExponentiatedGradient eps=0.005 | reduction | 0.7798 | 0.5349 | 0.1004 | 0.0293 |
| ExponentiatedGradient eps=0.02 | reduction | 0.7826 | 0.5302 | 0.1042 | 0.0236 |
| ThresholdOptimizer (TPR parity) | post-processing | 0.7858 | 0.5415 | **0.0153** | 0.0928 |

**Deployed:** ThresholdOptimizer. It is the only candidate that meets the 0.05 target on validation. ExponentiatedGradient (preferred because it needs no attribute at serving) is trained on the train split and its TPR gap did not carry over to validation (0.10 for every eps tried).

**Sensitive attribute at serving:** the API takes an optional `age_band`. It is required while ThresholdOptimizer is deployed, and it is used only to choose the group threshold. It is never a model input and is not used by SHAP or the probability. Age itself is never sent.

**Determinism:** ThresholdOptimizer randomises near the threshold. Each applicant gets a fixed uniform draw from a hash of their features, so a repeated request gets the same decision.

**Risks**
- Group-specific thresholds can amount to disparate treatment under some laws.
- The thresholds are fitted on validation, so the validation gap is in-sample. On the one-time test run the gap was 0.0519, slightly above target.
- The 65+ band (n=17 in validation, n=16 in test) is excluded from the gap and is not protected by the constraint.
