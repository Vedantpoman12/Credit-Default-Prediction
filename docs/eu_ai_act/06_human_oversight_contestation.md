# 06 Human Oversight and Contestation

> Educational artefact, not for real lending decisions. Not deployed.

**Human review:** every "refer" decision has `requires_human_review = true` (enforced in `src/api/policy.py`, tested in `tests/test_api.py`). On the test set, 928 of 4,500 applications (20.6%) were referred. A refer is produced whenever the fairness-constrained flag and the calibrated probability disagree, or the probability is between 0.30 and 0.60.

**Accountable role:** the *Credit Model Risk Owner* (in this project, the student team lead) is accountable for the model, signs off promotion, and owns contestation outcomes.

**Reviewer aids:** the top-5 SHAP contributions in each response, plus /recourse counterfactuals (actionable changes with age locked).

**Contestation process**
1. The applicant receives the decision, its main factors and a recourse suggestion.
2. The applicant may contest within 30 days. A credit officer re-reviews the case manually without being bound by the model output.
3. The officer logs the outcome, keyed to the request in `logs/decisions.jsonl` (timestamp, inputs, probability, decision, model and policy version).
4. Overturned decisions are reviewed monthly by the risk owner as a fairness and quality signal.

**Override:** officers can override any decision. Declines are never fully automated without a review path.

**Traceability:** `src/api/main.py` (`_log`), `src/api/policy.py`, `src/explain/recourse_dice.py`.
