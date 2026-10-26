PY ?= venv/bin/python

.PHONY: setup data eda train fairness explain evaluate test serve latency drift gates docker final

setup:
	python3 -m venv venv && venv/bin/pip install -r requirements.txt

data:
	$(PY) -m src.data.download
	$(PY) -m src.data.split

eda:
	$(PY) -m src.data.eda

train:
	$(PY) -m src.models.train_baselines
	$(PY) -m src.models.train_xgb
	$(PY) -m src.models.calibrate
	$(PY) -m src.models.evaluate
	$(PY) -m scripts.export_errors
	$(PY) -m src.fairness.proxy_analysis
	$(PY) -m src.fairness.sandbox_dev
	$(PY) -m src.fairness.apply_primary
	$(PY) -m src.fairness.tradeoff
	$(PY) -m src.models.model_info
	$(PY) -m scripts.evaluate_gates

explain:
	$(PY) -m src.explain.shap_explain
	$(PY) -m src.explain.recourse_dice

evaluate: gates
	$(PY) -m src.models.evaluate

gates:
	$(PY) -m scripts.evaluate_gates

test:
	$(PY) -m pytest -q tests

serve:
	$(PY) -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000

latency:
	$(PY) -m scripts.latency_test

drift:
	$(PY) -m src.monitoring.drift_report
	$(PY) -m src.monitoring.inject_drift

docker:
	docker build -f docker/Dockerfile -t credit-default-fair:latest .
	docker run --rm --cpus=4 -p 8000:8000 credit-default-fair:latest

final:
	$(PY) -m scripts.final_test_eval
