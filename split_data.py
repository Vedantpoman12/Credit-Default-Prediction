import os
import json
import argparse
import pandas as pd
from sklearn.model_selection import train_test_split

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
SPLITS_DIR = os.path.join(DATA_DIR, 'splits')


def get_data_filepath(filename, fallback_filename=None):
    """
    Find filepath in DATA_DIR or BASE_DIR.
    """
    candidates = [
        os.path.join(DATA_DIR, filename),
        os.path.join(BASE_DIR, filename),
    ]
    if fallback_filename:
        candidates.extend([
            os.path.join(DATA_DIR, fallback_filename),
            os.path.join(BASE_DIR, fallback_filename)
        ])
    for p in candidates:
        if os.path.exists(p):
            return p
    return None


def load_taiwan_df():
    """
    Load Taiwan credit card default dataset with appropriate header detection.
    """
    path = get_data_filepath("default_of_credit_card_clients.csv", "default of credit card clients.csv")
    if not path:
        raise FileNotFoundError("Taiwan dataset not found in data/ or project root.")
    
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        first_line = f.readline().strip()
    
    # If the first line is UCI metadata (e.g., ',X1,X2...'), header is on row 1
    if 'X1' in first_line and 'LIMIT_BAL' not in first_line:
        df = pd.read_csv(path, header=1)
    else:
        df = pd.read_csv(path, header=0)
    
    return df


def load_primary_df():
    """
    Load merged primary credit dataset (created from application and credit records).
    """
    path = get_data_filepath("merged_credit_data.csv")
    if not path:
        # If merged_credit_data.csv is not yet present, run preprocess_data
        print("merged_credit_data.csv not found. Running preprocess.py...")
        from preprocess import preprocess_data
        df = preprocess_data()
        if df is None:
            raise FileNotFoundError("Failed to generate merged_credit_data.csv.")
        return df
    return pd.read_csv(path)


def perform_stratified_split(df, target_col, id_col='ID', random_state=42, test_ratio=0.15, val_ratio=0.15):
    """
    Perform a 70/15/15 stratified train/val/test split.
    Preserves class ratio across all splits using stratify=y.
    
    Returns:
        dict containing DataFrames:
            'X_train', 'X_val', 'X_test',
            'y_train', 'y_val', 'y_test',
            'train_full', 'val_full', 'test_frozen',
            'stats'
    """
    total_non_train = test_ratio + val_ratio  # 0.30
    second_split_ratio = test_ratio / total_non_train  # 0.50 (half of the 30% temp)

    # 1. Feature matrix X and target y
    drop_cols = [target_col]
    if id_col in df.columns:
        drop_cols.append(id_col)
    
    X = df.drop(columns=drop_cols)
    y = df[target_col]

    # 2. First split: 70% Train, 30% Temp (Val + Test)
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=total_non_train, random_state=random_state, stratify=y
    )

    # 3. Second split: Split 30% Temp into 50/50 (15% Val, 15% Test)
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=second_split_ratio, random_state=random_state, stratify=y_temp
    )

    # Reconstruct full DataFrames (features + target + ID) maintaining original indices
    train_full = df.loc[X_train.index].copy()
    val_full = df.loc[X_val.index].copy()
    test_frozen = df.loc[X_test.index].copy()

    stats = {
        'total_samples': int(len(df)),
        'random_state': random_state,
        'train': {
            'samples': int(len(X_train)),
            'percentage': float(len(X_train) / len(df) * 100),
            'defaults': int(y_train.sum()),
            'default_rate': float(y_train.mean())
        },
        'val': {
            'samples': int(len(X_val)),
            'percentage': float(len(X_val) / len(df) * 100),
            'defaults': int(y_val.sum()),
            'default_rate': float(y_val.mean())
        },
        'test_frozen': {
            'samples': int(len(X_test)),
            'percentage': float(len(X_test) / len(df) * 100),
            'defaults': int(y_test.sum()),
            'default_rate': float(y_test.mean())
        }
    }

    return {
        'X_train': X_train,
        'X_val': X_val,
        'X_test': X_test,
        'y_train': y_train,
        'y_val': y_val,
        'y_test': y_test,
        'train_full': train_full,
        'val_full': val_full,
        'test_frozen': test_frozen,
        'stats': stats
    }


def save_splits(splits_dict, dataset_name, out_dir):
    """
    Save split files:
      - Complete datasets: train.csv, val.csv, test_frozen.csv
      - Separated matrices: X_train.csv, y_train.csv, X_val.csv, y_val.csv, X_test_frozen.csv, y_test_frozen.csv
      - Direct top-level copies in DATA_DIR for convenient access
    """
    os.makedirs(out_dir, exist_ok=True)

    # 1. Full dataframes
    splits_dict['train_full'].to_csv(os.path.join(out_dir, 'train.csv'), index=False)
    splits_dict['val_full'].to_csv(os.path.join(out_dir, 'val.csv'), index=False)
    splits_dict['test_frozen'].to_csv(os.path.join(out_dir, 'test_frozen.csv'), index=False)

    # 2. X and y separate
    splits_dict['X_train'].to_csv(os.path.join(out_dir, 'X_train.csv'), index=False)
    splits_dict['y_train'].to_csv(os.path.join(out_dir, 'y_train.csv'), index=False)
    splits_dict['X_val'].to_csv(os.path.join(out_dir, 'X_val.csv'), index=False)
    splits_dict['y_val'].to_csv(os.path.join(out_dir, 'y_val.csv'), index=False)
    splits_dict['X_test'].to_csv(os.path.join(out_dir, 'X_test_frozen.csv'), index=False)
    splits_dict['y_test'].to_csv(os.path.join(out_dir, 'y_test_frozen.csv'), index=False)

    # 3. Direct convenience copies in DATA_DIR: e.g. primary_train.csv, primary_test_frozen.csv
    prefix = f"{dataset_name}_"
    splits_dict['train_full'].to_csv(os.path.join(DATA_DIR, f"{prefix}train.csv"), index=False)
    splits_dict['val_full'].to_csv(os.path.join(DATA_DIR, f"{prefix}val.csv"), index=False)
    splits_dict['test_frozen'].to_csv(os.path.join(DATA_DIR, f"{prefix}test_frozen.csv"), index=False)

    print(f"[{dataset_name.upper()}] Saved split files to: {out_dir}")
    print(f"[{dataset_name.upper()}] Also created convenience files in: {DATA_DIR} (prefix: {prefix})")


def print_split_summary(dataset_name, stats):
    print(f"\n=======================================================")
    print(f"   {dataset_name.upper()} DATASET - STRATIFIED 70/15/15 SPLIT")
    print(f"=======================================================")
    print(f"Total Records: {stats['total_samples']:,} | Random State: {stats['random_state']}")
    print("-" * 55)
    print(f"Train Set:       {stats['train']['samples']:6,d} ({stats['train']['percentage']:.1f}%) | "
          f"Defaults: {stats['train']['defaults']:4,d} | Default Rate: {stats['train']['default_rate']:.4f}")
    print(f"Validation Set:  {stats['val']['samples']:6,d} ({stats['val']['percentage']:.1f}%) | "
          f"Defaults: {stats['val']['defaults']:4,d} | Default Rate: {stats['val']['default_rate']:.4f}")
    print(f"Test Set Frozen: {stats['test_frozen']['samples']:6,d} ({stats['test_frozen']['percentage']:.1f}%) | "
          f"Defaults: {stats['test_frozen']['defaults']:4,d} | Default Rate: {stats['test_frozen']['default_rate']:.4f}")
    print("=" * 55)


def main():
    parser = argparse.ArgumentParser(description="Stratified 70/15/15 Data Splitting for Credit Default Prediction")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility (default: 42)")
    args = parser.parse_args()

    all_stats = {}

    # ---------------------------------------------------------
    # 1. Primary Dataset (Credit Card Approval / Merged Records)
    # ---------------------------------------------------------
    print("\nProcessing Primary Dataset...")
    df_primary = load_primary_df()
    # In merged_credit_data.csv, target is 'is_default'
    primary_target = 'is_default' if 'is_default' in df_primary.columns else 'target'
    primary_splits = perform_stratified_split(
        df=df_primary,
        target_col=primary_target,
        id_col='ID',
        random_state=args.seed
    )
    primary_out_dir = os.path.join(SPLITS_DIR, 'primary')
    save_splits(primary_splits, dataset_name="primary", out_dir=primary_out_dir)
    print_split_summary("Primary (Credit Card Approval)", primary_splits['stats'])
    all_stats['primary'] = primary_splits['stats']

    # ---------------------------------------------------------
    # 2. Taiwan Dataset (Default of Credit Card Clients)
    # ---------------------------------------------------------
    print("\nProcessing Taiwan Dataset...")
    df_taiwan = load_taiwan_df()
    taiwan_target = 'default payment next month'
    taiwan_splits = perform_stratified_split(
        df=df_taiwan,
        target_col=taiwan_target,
        id_col='ID',
        random_state=args.seed
    )
    taiwan_out_dir = os.path.join(SPLITS_DIR, 'taiwan')
    save_splits(taiwan_splits, dataset_name="taiwan", out_dir=taiwan_out_dir)
    print_split_summary("Taiwan (Credit Card Clients)", taiwan_splits['stats'])
    all_stats['taiwan'] = taiwan_splits['stats']

    # Save summary metadata JSON for tracking
    summary_path = os.path.join(SPLITS_DIR, 'split_summary.json')
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(all_stats, f, indent=4)
    print(f"\nMetadata summary saved to: {summary_path}")
    print("\nData splitting completed successfully! Test sets are frozen.")


if __name__ == "__main__":
    main()
