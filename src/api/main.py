import json
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

from src.api.policy import decide
from src.api.schemas import RecourseResponse, ScoreRequest, ScoreResponse
from src.config import CFG, path
from src.explain.recourse_dice import recourse
from src.explain.shap_explain import ShapExplainer

FEATURES = CFG["primary"]["features"]
AGE_FOR_BAND = {"<25": 22, "25-34": 30, "35-44": 40, "45-54": 50, "55-64": 60, "65+": 70}
GUI = Path(__file__).parent / "static" / "index.html"
state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    models = path("models")
    state["policy"] = joblib.load(models / "policy.joblib")
    state["explainer"] = ShapExplainer()
    state["info"] = json.loads((models / "model_info.json").read_text())
    state["reference"] = pd.read_parquet(models / "dice_reference.parquet")
    path("logs").parent.mkdir(parents=True, exist_ok=True)
    yield
    state.clear()


app = FastAPI(
    title="Credit Default Scoring API",
    description="Educational artefact, not for real lending decisions. Fairness-constrained credit default scoring (BTECH CAP 501).",
    version="1.0.0",
    lifespan=lifespan,
)


def _frame(req: ScoreRequest) -> pd.DataFrame:
    policy = state["policy"]
    if policy.needs_sensitive and req.age_band is None:
        raise HTTPException(422, "age_band is required by the deployed fairness policy (threshold lookup only)")
    return pd.DataFrame([req.model_dump()])[FEATURES].astype(float)


def _log(req: ScoreRequest, resp: ScoreResponse) -> None:
    record = {"timestamp": datetime.now(timezone.utc).isoformat(), **req.model_dump(), **resp.model_dump(exclude={"top5_shap"})}
    with open(path("logs"), "a") as f:
        f.write(json.dumps(record) + "\n")


@app.post("/score", response_model=ScoreResponse)
def score(req: ScoreRequest) -> ScoreResponse:
    X = _frame(req)
    policy, info = state["policy"], state["info"]
    p = float(policy.predict_proba(X)[0])
    flag = int(policy.flag(X, [req.age_band])[0])
    band, decision, review = decide(p, flag)
    top5, _ = state["explainer"].top5_contributions(X)
    resp = ScoreResponse(default_probability=round(p, 4), band=band, decision=decision, requires_human_review=review,
                         top5_shap=top5, model_version=info["model_version"], policy_version=info["policy_version"])
    _log(req, resp)
    return resp


@app.post("/recourse", response_model=RecourseResponse)
def recourse_endpoint(req: ScoreRequest) -> RecourseResponse:
    X = _frame(req).assign(AGE=AGE_FOR_BAND.get(req.age_band, 40))
    return RecourseResponse(**recourse(X, state["reference"], state["policy"]))


@app.get("/model-info")
def model_info() -> dict:
    return state["info"]


@app.get("/decisions")
def decisions(limit: int = 20) -> list[dict]:
    log = path("logs")
    if not log.exists():
        return []
    lines = log.read_text().splitlines()[-limit:]
    return [json.loads(line) for line in reversed(lines)]


@app.get("/", include_in_schema=False)
def gui() -> FileResponse:
    return FileResponse(GUI)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model_loaded": "policy" in state}
