# Fairness Policy Decision

> Educational artefact, not for real lending decisions.

**Criterion:** equal opportunity across age bands: defaulters should be caught at the same rate (TPR) in every band. Target gap <= 0.05.

**Validation results** (reports/tradeoff_table.csv, model 66ab7c6b8c79, retrained 2026-10-27)

| Model | Family | ROC-AUC | F1 | TPR gap | FPR gap |
|---|---|---|---|---|---|
| Unconstrained XGBoost | none | 0.7828 | 0.5284 | 0.1077 | 0.0865 |
| ExponentiatedGradient eps=0.005 | reduction | 0.7865 | 0.5349 | 0.0754 | 0.0368 |
| ExponentiatedGradient eps=0.05 | reduction | 0.7873 | 0.5370 | 0.0842 | 0.0482 |
| ThresholdOptimizer (TPR parity) | post-processing | 0.7828 | 0.5421 | 0.0513 | 0.0707 |
| **Per-band thresholds (deployed)** | post-processing | 0.7828 | 0.5307 | **0.0075** | 0.0836 |

**Deployed:** deterministic per-age-band thresholds (`GroupThresholds` in `src/fairness/policy.py`).
- The global operating point is the class-weighted model's 0.5 cut on its raw score, which gives TPR 0.631 on validation.
- Each band with n >= 30 gets its own score threshold so that its TPR matches that target: <25 0.628, 25-34 0.473, 35-44 0.494, 45-54 0.499, 55-64 0.526.
- The 65+ band (n=17) uses the global threshold.
- Resulting validation TPR by band: 0.633 / 0.630 / 0.631 / 0.629 / 0.625.

**Why not ThresholdOptimizer:**
- It randomises decisions near the threshold, and 9-29% of defaulters in each band received a coin-flip decision.
- Its expected TPR gap was 0.000; the reported 0.051 was entirely noise from those random draws.
- The deployed policy keeps the same idea (one threshold per group to equalise TPR) but makes every decision deterministic and explainable.

**Why not ExponentiatedGradient (preferred by the plan because it needs no attribute at serving):** it is trained on train, and no eps reached a gap <= 0.05 on validation (best 0.075).

**Sensitive attribute at serving:** the API takes `age_band` only to select the threshold. It is never a model input and does not affect the probability or the SHAP values.

**Risks and limitations**
- **In-sample gap.** Thresholds are selected on validation, as Step 3 prescribes, so the validation gap of 0.0075 is in-sample.
- **Measurement noise.** The 55-64 band has 48 validation defaulters, so its TPR alone has a standard error of about 0.07. Cross-fitting on half-validation gave out-of-sample gaps of about 0.17 for both post-processors. A 0.05 gap cannot be verified on held-out data of this size.
- **Disparate treatment.** Group-specific thresholds can amount to disparate treatment under some laws.
- **Unconstrained small group.** The 65+ band is too small to constrain or measure.
- **No test result yet.** The one-time test evaluation was run on the previous model (ThresholdOptimizer, test gap 0.052) and has not been repeated.
