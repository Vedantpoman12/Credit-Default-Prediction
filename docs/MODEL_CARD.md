# Model Card: Fairness-Constrained Credit Default Model

> Educational artefact, not for real lending decisions.

| Field | Value |
|---|---|
| Version | model 2c8471a0552e, policy exponentiated_gradient-refer0.3-0.6 (retrained 2026-10-27) |
| Type | XGBoost (max_depth 6, 397 trees, lr 0.0128, scale_pos_weight 3.52, monotone constraints) -> Fairlearn ExponentiatedGradient (eps 0.01, TPR parity across age bands; 15 base models, 4 with non-zero weight) -> isotonic recalibration of the ensemble score |
| Tuning | Optuna, 100 trials, stratified 5-fold CV on the training split (CV AUC 0.7904) |
| Training data | Taiwan credit-card clients, 21,000-row train split (checksum fd376628...) |
| Features | 21 inputs + 19 engineered (utilisation, paid-vs-bill ratios, months late, worst delay, mean status, utilisation trend, paid-to-billed, headroom) + 4 missing-value flags; no AGE, no SEX |
| Age at serving | Not needed (the API's optional `age_band` is only logged and used by DiCE) |
| Intended use | Teaching fairness-aware credit modelling |
| Out of scope | Any real credit, employment or insurance decision |

**Performance**
| Metric | Validation | Test (once, 2026-11-23) | Target |
|---|---|---|---|
| ROC-AUC | 0.783 (base model 0.7826 [0.7639, 0.7996]) | 0.7803 [0.7621, 0.7977] | >= 0.75 |
| PR-AUC | 0.535 | 0.5326 [0.5035, 0.5675] | - |
| F1 / precision / recall | 0.523 / 0.452 / 0.620 | 0.536 / 0.458 / 0.646 | - |
| ECE (served probability) | 0.0001 (in-sample: calibrator fitted on validation) | 0.0140 | <= 0.05 |
| Brier | 0.1346 | 0.1356 | - |

**Fairness (equal opportunity across age bands, n >= 30)**
| Model | Validation TPR gap | Test TPR gap |
|---|---|---|
| Unconstrained XGBoost | 0.0852 | 0.2149 |
| ThresholdOptimizer | 0.0375 (in-sample) | 0.0830 |
| **ExponentiatedGradient eps 0.01 (deployed)** | **0.0454** | **0.1530 (fails the 0.05 target)** |

On test the youngest band is flagged most (<25 TPR 0.732, FPR 0.294) and 55-64 least (TPR 0.579, 38 defaulters, standard error ~0.08). The validation gap did not generalise. The test result was not used to retune anything.

**Latency:** median 37-42 ms over HTTP (uvicorn, one worker, 500 requests; target <= 50 ms) after the one-pass scoring change (decision #23). It was 315 ms before.

**Limitations**
- Fails the fairness target on test data; the young-applicant disparity persists.
- A 0.05 gap cannot be verified for the 55-64 band at this sample size; 65+ is too small to measure.
- The isotonic calibrator outputs only ~90 distinct probabilities and gives some applicants exactly 0.
- EG is a randomised classifier: ~7.6% of defaulters get a non-degenerate probability, resolved by a deterministic hash draw.
- SHAP explains the base XGBoost model, not the 4-member EG ensemble that issues the decision.
- Data come from a single Taiwanese bank in 2005.

**Previous version:** model ed30878f38dc (ThresholdOptimizer): test ROC-AUC 0.781, ECE 0.0145, TPR gap 0.0519 (`reports/final_results_ed30878f38dc.json`).

**Traceability:** `models/model_info.json`, `reports/validation_metrics.json`, `reports/fairness_candidates.json`, `reports/tradeoff_table.csv`, `reports/calibration.json`, `reports/final_results.json`, `docs/decisions_log.md` #21-#24.
