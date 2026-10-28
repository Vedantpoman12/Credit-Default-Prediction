# Model Card: Fairness-Constrained Credit Default Model

> Educational artefact, not for real lending decisions.

| Field | Value |
|---|---|
| Version | model 66ab7c6b8c79, policy group_thresholds-refer0.3-0.6 (retrained 2026-10-27) |
| Type | XGBoost (max_depth 5, 383 trees, lr 0.0134, scale_pos_weight 3.52) -> Platt calibration -> deterministic per-age-band thresholds (equal opportunity) |
| Tuning | Optuna, 100 trials, stratified 5-fold CV on the training split (CV AUC 0.7904) |
| Training data | Taiwan credit-card clients, 21,000-row train split (checksum fd376628...) |
| Features | 21 inputs + 19 engineered (utilisation, paid-vs-bill ratios, months late, worst delay, mean status, utilisation trend, paid-to-billed, headroom); no AGE, no SEX |
| Intended use | Teaching fairness-aware credit modelling |
| Out of scope | Any real credit, employment or insurance decision |

**Performance (validation)**
| Metric | Value |
|---|---|
| ROC-AUC | 0.7828 [0.7638, 0.7993] |
| PR-AUC | 0.5598 [0.5275, 0.5939] |
| F1 (deployed policy) | 0.5307 |
| ECE | 0.0178 out-of-fold (0.1979 before calibration) |
| Brier | see reports/calibration.json |

The previous model's raw validation AUC was 0.7801 and its PR-AUC 0.5532, so retraining improved AUC by 0.0027 and PR-AUC by 0.0066.

**Fairness (equal opportunity across age bands, n >= 30)**
| Model | Validation TPR gap |
|---|---|
| Unconstrained | 0.1077 |
| ExponentiatedGradient (best, eps 0.005) | 0.0754 |
| ThresholdOptimizer | 0.0513 |
| Per-band thresholds (deployed) | 0.0075 (in-sample) |

**Test set:** the one-time evaluation (`reports/final_results.json`) belongs to the previous model (test AUC 0.781, ECE 0.014, TPR gap 0.052). It has not been repeated for this model.

**Limitations**
- The validation fairness gap is in-sample.
- A 0.05 gap cannot be verified on held-out data of this size (55-64 band: 48 validation defaulters).
- The deployed policy needs the age band at serving.
- SHAP explains the raw score only, not the calibration or the threshold.
- The data comes from a single Taiwanese bank in 2005.

**Traceability:** `reports/validation_metrics.json`, `reports/tradeoff_table.csv`, `reports/calibration.json`, `models/model_info.json`, `metrics/gate_results.json`.
