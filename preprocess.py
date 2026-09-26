import pandas as pd
import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

def preprocess_data():
    """
    Preprocess the application and credit records datasets.
    """
    app_path = os.path.join(DATA_DIR, 'application_record.csv')
    credit_path = os.path.join(DATA_DIR, 'credit_record.csv')
    
    if not os.path.exists(app_path) or not os.path.exists(credit_path):
        print("Data files not found in data/ directory.")
        return None
        
    print("Loading datasets...")
    app_df = pd.read_csv(app_path)
    credit_df = pd.read_csv(credit_path)
    
    print(f"Original Application Data Shape: {app_df.shape}")
    print(f"Original Credit Data Shape: {credit_df.shape}")

    # 1. Convert and Correct Age Anomalies
    print("Converting DAYS_BIRTH to positive AGE in years...")
    # application_record.csv stores age as DAYS_BIRTH (counted backwards as negative days)
    # Convert this into a standard positive AGE column in years
    app_df['AGE'] = np.abs(app_df['DAYS_BIRTH']) / 365.25
    app_df.drop('DAYS_BIRTH', axis=1, inplace=True)
    
    # 2. Handle Missingness (Imputation)
    print("Handling missingness in OCCUPATION_TYPE...")
    # Impute missing entries (134,203 missing) with 'Unknown'
    app_df['OCCUPATION_TYPE'] = app_df['OCCUPATION_TYPE'].fillna('Unknown')
    
    # 3. Merge the Application and Credit Records
    print("Merging the Application and Credit Records...")
    # Create a target label based on STATUS
    # '0', '1', '2', '3', '4', '5' -> past due, 'C' -> paid off, 'X' -> no loan for the month
    # We will define a user as a 'default' (1) if they ever had a status of '2', '3', '4', '5'
    # '0' and '1' are early delinquencies, usually not counted as hard default, but we can count anything >= 1 as default.
    # Let's count '2', '3', '4', '5' as default (>= 60 days past due).
    credit_df['is_default'] = credit_df['STATUS'].apply(lambda x: 1 if x in ['2', '3', '4', '5'] else 0)
    
    # Group by ID and take the max (if they ever defaulted, it will be 1)
    target_df = credit_df.groupby('ID')['is_default'].max().reset_index()
    
    # Merge with application records
    merged_df = pd.merge(app_df, target_df, on='ID', how='inner')
    
    print(f"Merged Dataset Shape: {merged_df.shape}")
    
    # Save the merged dataset
    output_path = os.path.join(DATA_DIR, 'merged_credit_data.csv')
    merged_df.to_csv(output_path, index=False)
    print(f"Saved merged dataset to: {output_path}")
    
    return merged_df

if __name__ == "__main__":
    preprocess_data()
