# Final Evaluation, Slides, Demo and Viva Prep

> Educational artefact, not for real lending decisions.

## 12-slide outline
| # | Title | Bullets | Visual |
|---|---|---|---|
| 1 | Problem and risk | Default prediction for lending; EU AI Act high-risk (Annex III 5b); fairness is a hard requirement | System diagram |
| 2 | Data | Taiwan 30k clients, 22.1% default; sandbox with sex and age; 3 quality issues | eda_class_balance.png, eda_default_by_age_band.png |
| 3 | Method | Pipeline fitted on train only; XGBoost + Optuna 25 trials; age audit-only | Pipeline diagram |
| 4 | Imbalance and calibration | scale_pos_weight 3.52; isotonic: ECE 0.203 -> 0.012; test ECE 0.0145 | reliability_diagram.png |
| 5 | Fairness approach | Equal opportunity over age bands; ExponentiatedGradient vs ThresholdOptimizer; no proxy > 0.4 | proxy table excerpt |
| 6 | Trade-off frontier | Unconstrained gap 0.118; EG 0.100; TO 0.015 at the same AUC | tradeoff_frontier.png |
| 7 | SHAP and recourse demo | PAY_0, LIMIT_BAL, PAY_2 lead; 3 waterfalls; 3/3 verified counterfactuals, age locked | shap_beeswarm.png, waterfall |
| 8 | Deployment | FastAPI /score /recourse /model-info /health; Docker; median 10.3 ms | Swagger screenshot |
| 9 | Monitoring | PSI policy 0.1 / 0.25; income shift PSI 1.21; base-rate rise caught by label PSI | decline_rate_trend.png, Evidently HTML |
| 10 | CI fairness gate demo | Two gates; unfair branch fails at gap 0.1175; merge blocked | CI screenshot |
| 11 | EU AI Act and limitations | 8-document package; test gap 0.0519 (just over target); age band needed at serving | Doc list |
| 12 | Lessons learned | Train-fitted reductions did not generalise across small groups; in-sample ECE misleads; fairness needs monitoring | Summary table |

## 5-minute live demo
```bash
make serve                                   # or: docker run --rm --cpus=4 -p 8000:8000 credit-default-fair:latest
curl -s localhost:8000/health
curl -s localhost:8000/model-info | python -m json.tool | head -30
curl -s -X POST localhost:8000/score -H 'Content-Type: application/json' -d '{"LIMIT_BAL":50000,"EDUCATION":2,"MARRIAGE":1,"PAY_0":0,"PAY_2":0,"PAY_3":0,"PAY_4":0,"PAY_5":0,"PAY_6":0,"BILL_AMT1":20000,"BILL_AMT2":19000,"BILL_AMT3":18000,"BILL_AMT4":17000,"BILL_AMT5":16000,"BILL_AMT6":15000,"PAY_AMT1":1500,"PAY_AMT2":1500,"PAY_AMT3":1500,"PAY_AMT4":1500,"PAY_AMT5":1500,"PAY_AMT6":1500,"age_band":"25-34"}'
curl -s -X POST localhost:8000/recourse -H 'Content-Type: application/json' -d '{"LIMIT_BAL":50000,"EDUCATION":2,"MARRIAGE":1,"PAY_0":2,"PAY_2":2,"PAY_3":0,"PAY_4":0,"PAY_5":0,"PAY_6":0,"BILL_AMT1":20000,"BILL_AMT2":19000,"BILL_AMT3":18000,"BILL_AMT4":17000,"BILL_AMT5":16000,"BILL_AMT6":15000,"PAY_AMT1":0,"PAY_AMT2":1500,"PAY_AMT3":1500,"PAY_AMT4":1500,"PAY_AMT5":1500,"PAY_AMT6":1500,"age_band":"25-34"}'
python -m scripts.evaluate_gates --candidate models/candidates/unconstrained.joblib   # fairness gate FAIL
```
Fallback without a network or server: `pytest -q tests/test_api.py -v` (in-process TestClient), then open the saved figures and `reports/drift/evidently_drift_report.html`.

## 15 viva questions
1. **Why equal opportunity over demographic parity?** Base rates differ by age band (20-27%); parity would force equal decline rates whatever the risk. Equal opportunity equalises how often true defaulters are caught.
2. **Why exclude age?** It is the protected attribute; using it would discriminate directly. It is kept only for auditing.
3. **Then why does the API take age_band?** ThresholdOptimizer needs the group to pick its threshold. It is never a model input. ExponentiatedGradient, which needs no attribute, missed the target.
4. **Is group-specific thresholding legal?** It depends on the jurisdiction. It can be disparate treatment (in the US under ECOA, for example). That is why it is documented as a risk and refers go to human review.
5. **What does calibration give you?** Probabilities that mean what they say (ECE 0.0145 on test), so thresholds and expected-loss decisions are meaningful.
6. **Why isotonic over Platt?** Lower out-of-fold ECE (0.0116 vs 0.0160) on 4,500 validation rows.
7. **Why out-of-fold ECE?** Isotonic fitted and scored on the same rows gave 0.0003, which is optimistic.
8. **Why didn't ExponentiatedGradient work?** It is fitted on train; with 48 defaulters in the 55-64 validation band, TPR has about ±0.07 sampling noise, so the train-time constraint did not carry over.
9. **Test TPR gap is 0.0519. Did you fail?** It is 0.0019 over the target and was reported without retuning, as the test-once protocol requires. Validation was 0.0153; the difference is sampling noise in small bands.
10. **What happens when data drifts?** PSI flags it (income shift 1.21). In both injected scenarios the fairness gap broke 0.05 while AUC held, so retraining needs the fairness re-audit.
11. **How do you know there is no leakage?** Transformers are fitted on train only (unit tested), AUC of 0.78 is typical for this dataset, and the test split is locked.
12. **How does SHAP relate to the final decision?** It explains the raw XGBoost score; calibration is monotone, but the age-band threshold is not shown by SHAP.
13. **How are randomised predictions made deterministic?** Each applicant gets a uniform draw from a hash of their features, so the same input gives the same decision.
14. **Why are refers needed?** They send the zone of disagreement or uncertainty (20.6% of test cases) to a human, as human oversight requires.
15. **Biggest limitation?** One 2005 Taiwanese bank; very small 65+ group; the deployed policy needs the sensitive attribute.

## One-page final report outline
| Objective | Section | Evidence |
|---|---|---|
| OBJ-1 Data pipeline and frozen splits | Data and preprocessing | src/data, tests/test_features.py, SPLIT_CHECKSUMS.json |
| OBJ-2 Accurate, calibrated model (AUC >= 0.75, ECE <= 0.05) | Modelling | Test AUC 0.781, ECE 0.0145 |
| OBJ-3 Fairness (TPR gap <= 0.05) | Fairness engineering | Val 0.0153, test 0.0519; tradeoff_table.csv |
| OBJ-4 Explainability and recourse | Explainability | SHAP plots, 3/3 verified DiCE counterfactuals |
| OBJ-5 Deployment (latency <= 50 ms) | Deployment | Median 10.3 ms, Docker, tests/test_api.py |
| OBJ-6 MLOps, monitoring and governance | MLOps and compliance | CI gates, drift report, EU AI Act package |
