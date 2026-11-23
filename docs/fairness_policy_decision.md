# Fairness Policy Decision

> Educational artefact, not for real lending decisions.

**Criterion:** equal opportunity across age bands: defaulters should be caught at the same rate (TPR) in every band. Target gap <= 0.05. Bands with n < 30 (65+) are reported but excluded from the gap.

**Candidates** (`reports/tradeoff_table.csv`, model 2c8471a0552e)

| Policy | Family | Val ROC-AUC | Val F1 | Val TPR gap | Test TPR gap |
|---|---|---|---|---|---|
| Unconstrained XGBoost | none | 0.7826 | 0.5265 | 0.0852 | 0.2149 |
| ExponentiatedGradient eps=0.005 | reduction | 0.7836 | 0.5254 | 0.0686 | - |
| **ExponentiatedGradient eps=0.01 (deployed)** | reduction | 0.7833 | 0.5229 | **0.0454** | **0.1530** |
| ExponentiatedGradient eps=0.02 | reduction | 0.7837 | 0.5287 | 0.0668 | - |
| ExponentiatedGradient eps=0.05 | reduction | 0.7845 | 0.5261 | 0.0703 | 0.1633 |
| ThresholdOptimizer (TPR parity) | post-processing | 0.7826 | 0.5425 | 0.0375* | 0.0830 |
| Per-band thresholds | post-processing | 0.7826 | 0.5286 | 0.0134* | - |

\* In-sample: post-processing thresholds are fitted on validation. EG is trained on the training split, so its validation gap is held out. Test gaps come from `scripts/final_test_eval.py` (run once for this model, 2026-11-23).

**Deployed:** ExponentiatedGradient, eps 0.01 (decision #21). It was the only candidate with a held-out validation gap <= 0.05, and it needs no age band at serving time.

**History:** ThresholdOptimizer was deployed first (#8) but randomised 9-29% of defaulters' decisions, and its whole validation gap was random-draw noise. Deterministic per-band thresholds replaced it (#17), but their gap could only be measured in-sample. EG replaced both (#21).

**Test result (decision #24):** the deployed policy fails the target on test (gap 0.153; unconstrained 0.215). The youngest band is flagged most (<25 TPR 0.732, FPR 0.294); 55-64 least (TPR 0.579). Mitigation reduces the disparity but does not meet the target on new data. ThresholdOptimizer generalised better (0.083) but still fails, randomises decisions and needs age at serving. Nothing was retuned on the test set.

**Risks and limitations**
- **Validation gap did not generalise.** Selecting among seven candidates on one validation split overfits the gap; a cross-validated selection, or a larger validation set, is needed.
- **Measurement noise.** 55-64 has 48 validation and 38 test defaulters (TPR standard error ~0.07-0.08).
- **Randomised classifier.** EG mixes 4 models; ~7.6% of defaulters get a probability strictly between 0.05 and 0.95, resolved by a deterministic per-applicant hash draw.
- **Unconstrained small group.** 65+ is too small to constrain or measure.
