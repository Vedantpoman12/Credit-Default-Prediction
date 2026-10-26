import joblib
import mlflow
import numpy as np
import optuna
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedKFold
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier

from src.config import CFG, path
from src.data.split import load_split
from src.features.pipeline import build_pipeline
from src.models.train_baselines import setup_mlflow

SEED = CFG["seed"]


def make_xgb(params: dict, spw: float, **kw) -> XGBClassifier:
    return XGBClassifier(**params, scale_pos_weight=spw, eval_metric="auc", tree_method="hist", random_state=SEED, n_jobs=4, **kw)


def search_space(trial: optuna.Trial) -> dict:
    return {
        "max_depth": trial.suggest_int("max_depth", 2, 8),
        "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
        "min_child_weight": trial.suggest_float("min_child_weight", 1, 20, log=True),
        "subsample": trial.suggest_float("subsample", 0.5, 1.0),
        "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
        "reg_lambda": trial.suggest_float("reg_lambda", 1e-3, 10, log=True),
        "gamma": trial.suggest_float("gamma", 0, 5),
    }


def main() -> None:
    setup_mlflow()
    X, y, _ = load_split("train")
    spw = float((y == 0).sum() / (y == 1).sum())
    folds = list(StratifiedKFold(CFG["optuna"]["cv_folds"], shuffle=True, random_state=SEED).split(X, y))

    def objective(trial: optuna.Trial) -> float:
        params = search_space(trial)
        aucs, iters = [], []
        for tr, va in folds:
            prep = build_pipeline().fit(X.iloc[tr])
            Xtr, Xva = prep.transform(X.iloc[tr]), prep.transform(X.iloc[va])
            m = make_xgb(params, spw, n_estimators=1000, early_stopping_rounds=50).fit(Xtr, y.iloc[tr], eval_set=[(Xva, y.iloc[va])], verbose=False)
            aucs.append(roc_auc_score(y.iloc[va], m.predict_proba(Xva)[:, 1]))
            iters.append(m.best_iteration + 1)
        trial.set_user_attr("n_estimators", int(np.mean(iters)))
        return float(np.mean(aucs))

    optuna.logging.set_verbosity(optuna.logging.WARNING)
    study = optuna.create_study(direction="maximize", sampler=optuna.samplers.TPESampler(seed=SEED))
    study.optimize(objective, n_trials=CFG["optuna"]["n_trials"])
    best = dict(study.best_params, n_estimators=study.best_trial.user_attrs["n_estimators"])
    model = Pipeline([("prep", build_pipeline()), ("xgb", make_xgb(best, spw))]).fit(X, y)
    joblib.dump({"params": best, "scale_pos_weight": spw}, path("models") / "xgb_params.joblib")
    joblib.dump(model, path("models") / "xgb_pipeline.joblib")
    with mlflow.start_run(run_name="xgboost_optuna"):
        mlflow.log_params({**best, "scale_pos_weight": spw, "n_trials": CFG["optuna"]["n_trials"]})
        mlflow.log_metric("cv_roc_auc", study.best_value)
        mlflow.sklearn.log_model(model, name="model", serialization_format="cloudpickle")
    print("best CV AUC", round(study.best_value, 4), best)


if __name__ == "__main__":
    main()
