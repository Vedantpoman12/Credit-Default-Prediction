# Model Card: Fairness-Constrained Credit Default Model

> Educational artefact, not for real lending decisions.

| Field | Value |
|---|---|
| Version | model ed30878f38dc, policy threshold_optimizer-refer0.3-0.6 |
| Type | XGBoost (max_depth 5, 341 trees, lr 0.0155, scale_pos_weight 3.52) -> isotonic calibration -> Fairlearn ThresholdOptimizer (TPR parity, age bands) |
| Training data | Taiwan credit-card clients, 21,000-row train split (checksum fd376628...) |
| Features | 21 (no AGE, no SEX) |
| Intended use | Teaching fairness-aware credit modelling |
| Out of scope | Any real credit, employment or insurance decision |

**Performance**
| Metric | Validation | Test (once) |
|---|---|---|
| ROC-AUC | 0.7858 [0.7687, 0.8014] | 0.7808 [0.7623, 0.7984] |
| PR-AUC | 0.5417 | 0.5342 |
| F1 / precision / recall (deployed flag) | 0.5415 / - / - | 0.5343 / 0.4679 / 0.6225 |
| ECE | 0.0116 (out-of-fold; 0.2029 before calibration) | 0.0145 |
| Brier | 0.1362 (out-of-fold) | 0.1350 |

**Fairness (equal opportunity across age bands, n >= 30)**
| Model | Val TPR gap | Test TPR gap |
|---|---|---|
| Unconstrained | 0.1175 | 0.1896 |
| ExponentiatedGradient (eps 0.02) | 0.1042 | 0.1190 |
| ThresholdOptimizer (deployed) | 0.0153 | 0.0519 |

Test TPR by band: <25 0.629, 25-34 0.638, 35-44 0.593, 45-54 0.645, 55-64 0.605 (65+ n=16, excluded).

**Limitations:** the test TPR gap is 0.0019 above the 0.05 target; the deployed policy needs the age band at serving; SHAP explains the raw score only; the data is a single 2005 Taiwanese bank.

**Traceability:** `reports/final_results.json`, `reports/tradeoff_table.csv`, `models/model_info.json`.
