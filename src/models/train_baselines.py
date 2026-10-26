import mlflow
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, f1_score, roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from src.config import CFG
from src.data.split import load_split
from src.features.pipeline import build_pipeline


def setup_mlflow() -> None:
    mlflow.set_tracking_uri(CFG["mlflow"]["tracking_uri"])
    mlflow.set_experiment(CFG["mlflow"]["experiment"])


def main() -> None:
    setup_mlflow()
    X, y, _ = load_split("train")
    Xv, yv, _ = load_split("val")
    models = {
        "majority_class": DummyClassifier(strategy="most_frequent"),
        "logistic_regression": LogisticRegression(class_weight="balanced", max_iter=2000, random_state=CFG["seed"]),
    }
    for name, clf in models.items():
        pipe = Pipeline([("prep", build_pipeline()), ("scale", StandardScaler()), ("clf", clf)]).fit(X, y)
        p = pipe.predict_proba(Xv)[:, 1]
        metrics = {"val_roc_auc": roc_auc_score(yv, p), "val_pr_auc": average_precision_score(yv, p), "val_f1": f1_score(yv, pipe.predict(Xv))}
        with mlflow.start_run(run_name=name):
            mlflow.log_params({"model": name, **{k: v for k, v in clf.get_params().items() if isinstance(v, (int, float, str))}})
            mlflow.log_metrics(metrics)
            mlflow.sklearn.log_model(pipe, name="model", serialization_format="cloudpickle")
        print(name, {k: round(v, 4) for k, v in metrics.items()})


if __name__ == "__main__":
    main()
