# Failing-Commit Demo (Fairness Gate)

> Educational artefact, not for real lending decisions.

1. Settings -> Branches -> add a protection rule for `main`: require a pull request and require the status check `test-and-gate` to pass. Turn on "Do not allow bypassing".
2. Create the demo branch that skips mitigation:
   ```bash
   git checkout -b demo/unfair-model
   python -m src.fairness.apply_primary --skip-mitigation   # deploys the unconstrained model as models/policy.joblib
   python -m src.models.model_info
   python -m scripts.evaluate_gates                          # locally: FAIRNESS GATE tpr_gap=0.1175 -> FAIL
   git commit -am "demo: deploy unconstrained model (skips fairness mitigation)"
   git push -u origin demo/unfair-model
   ```
3. Open a PR into `main`. CI result: "Performance gate" green (AUC 0.7858), "Fairness gate" red (TPR gap 0.1175 > 0.05), and merge is blocked.
4. Restore with `git checkout main`, or rerun `python -m src.fairness.apply_primary` without the flag.

**Screenshot checklist:** (a) branch-protection settings page; (b) Actions run with the red "Fairness gate" step and its log line; (c) the PR page showing "Merging is blocked"; (d) the green run on `main`; (e) the downloaded `gate_results.json`.
