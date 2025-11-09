"""
Multinomial Logit (MNL) / Conditional Logit Model Training Script
Trains a model to predict car choice based on attributes.
"""

import pandas as pd
import numpy as np
import pickle
from pathlib import Path
from scipy.optimize import minimize
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Fixed categorical bases for stable encoding
BASE_TYPE = 'van'
BASE_FUEL = 'gasoline'
L2_REGULARIZATION = 1e-4  # L2 penalty for stability

def load_data(csv_path='Car.csv'):
    """Load the car choice dataset."""
    data_path = Path(__file__).parent / csv_path
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset not found at {data_path}. Please ensure Car.csv is in the backend directory.")
    
    df = pd.read_csv(data_path)
    print(f"Loaded dataset with {len(df)} choice sets")
    print(f"Columns: {df.columns.tolist()}")
    return df

def reshape_to_long_format(df):
    """
    Reshape data from wide format to long format.
    Wide format: one row per choice set with columns type1..6, fuel1..6, etc.
    Long format: one row per alternative in each choice set.
    """
    n_alternatives = 6
    n_choice_sets = len(df)
    
    # Initialize lists to store long format data
    choice_set_ids = []
    alternative_ids = []
    choices = []
    attributes = {
        'type': [],
        'fuel': [],
        'price': [],
        'speed': [],
        'pollution': [],
        'size': []
    }
    
    # Store demographic variables for each choice set
    demographics = {
        'college': [],
        'hsg2': [],
        'coml5': []
    }
    
    # Reshape each choice set
    for idx, row in df.iterrows():
        choice_set_id = idx
        
        # Determine which alternative was chosen from the 'choice' column
        # Format: "choice1", "choice2", etc.
        choice_str = str(row['choice']).strip()
        if choice_str.startswith('choice'):
            chosen_alt = int(choice_str.replace('choice', ''))
        else:
            # Fallback: try to parse as integer
            try:
                chosen_alt = int(choice_str)
            except:
                print(f"Warning: Could not parse choice '{choice_str}' in row {idx}, defaulting to 1")
                chosen_alt = 1
        
        # Create rows for each alternative
        for alt in range(1, n_alternatives + 1):
            choice_set_ids.append(choice_set_id)
            alternative_ids.append(alt)
            choices.append(1 if alt == chosen_alt else 0)
            
            attributes['type'].append(row[f'type{alt}'])
            attributes['fuel'].append(row[f'fuel{alt}'])
            attributes['price'].append(row[f'price{alt}'])
            attributes['speed'].append(row[f'speed{alt}'])
            attributes['pollution'].append(row[f'pollution{alt}'])
            attributes['size'].append(row[f'size{alt}'])
            
            # Add demographics (same for all alternatives in a choice set)
            demographics['college'].append(row.get('college', 0))
            demographics['hsg2'].append(row.get('hsg2', 0))
            demographics['coml5'].append(row.get('coml5', 0))
    
    # Create DataFrame in long format
    long_df = pd.DataFrame({
        'choice_set_id': choice_set_ids,
        'alternative_id': alternative_ids,
        'choice': choices,
        **attributes,
        **demographics
    })
    
    print(f"Reshaped to long format: {len(long_df)} rows ({n_choice_sets} choice sets × {n_alternatives} alternatives)")
    
    # Normalize strings to prevent encoding mismatches
    long_df['type'] = long_df['type'].astype(str).str.strip().str.lower()
    long_df['fuel'] = long_df['fuel'].astype(str).str.strip().str.lower()
    
    # Force numerics to float (cast all numerics to float)
    numeric_cols = ['price', 'speed', 'pollution', 'size', 'college', 'hsg2', 'coml5']
    for c in numeric_cols:
        long_df[c] = pd.to_numeric(long_df[c], errors='coerce')
    
    # If any numeric is NaN for any alternative, drop the entire choice_set_id
    initial_len = len(long_df)
    nan_mask = long_df[numeric_cols].isna().any(axis=1)
    invalid_choice_sets = long_df[nan_mask]['choice_set_id'].unique()
    if len(invalid_choice_sets) > 0:
        print(f"Warning: Dropping {len(invalid_choice_sets)} choice sets with NaN values in numerics")
        long_df = long_df[~long_df['choice_set_id'].isin(invalid_choice_sets)]
        print(f"Dropped {initial_len - len(long_df)} rows")
    
    # Assert that every remaining set has exactly 6 alternatives and exactly one chosen
    alt_counts = long_df.groupby('choice_set_id')['alternative_id'].count()
    if not all(alt_counts == n_alternatives):
        invalid_sets = alt_counts[alt_counts != n_alternatives].index.tolist()
        raise ValueError(f"Invalid choice sets (not exactly {n_alternatives} alternatives): {invalid_sets[:10]}")
    
    choice_counts = long_df.groupby('choice_set_id')['choice'].sum()
    if not all(choice_counts == 1):
        invalid_sets = choice_counts[choice_counts != 1].index.tolist()
        raise ValueError(f"Invalid choice sets (not exactly 1 choice): {invalid_sets[:10]}")
    
    return long_df

def encode_categorical_features(long_df, type_base=BASE_TYPE, fuel_base=BASE_FUEL, feature_schema=None):
    """
    Encode categorical variables (type, fuel) into numeric features.
    Uses one-hot encoding with fixed base categories for stability.
    
    If feature_schema is provided, uses it to ensure consistent encoding.
    Otherwise, builds schema from the provided data.
    
    Returns:
    - encoded_df: DataFrame with encoded features
    - feature_cols: List of feature column names
    - feature_schema: Dict with category levels and bases for reproducibility
    """
    # Normalize strings (in case not done earlier)
    long_df = long_df.copy()
    long_df['type'] = long_df['type'].astype(str).str.strip().str.lower()
    long_df['fuel'] = long_df['fuel'].astype(str).str.strip().str.lower()
    
    # Normalize base categories too
    type_base = str(type_base).strip().lower()
    fuel_base = str(fuel_base).strip().lower()
    
    # Create encoded dataframe
    encoded_df = long_df.copy()
    
    if feature_schema is None:
        # Build schema from this data
        type_values = sorted(long_df['type'].unique())
        fuel_values = sorted(long_df['fuel'].unique())
        
        # Verify base categories exist
        if type_base not in type_values:
            raise ValueError(f"Base type '{type_base}' not found in data. Available: {type_values}")
        if fuel_base not in fuel_values:
            raise ValueError(f"Base fuel '{fuel_base}' not found in data. Available: {fuel_values}")
        
        print(f"Type categories: {type_values}")
        print(f"Fuel categories: {fuel_values}")
        print(f"Using fixed bases: type={type_base}, fuel={fuel_base}")
    else:
        # Use provided schema
        type_values = feature_schema['type_categories']
        fuel_values = feature_schema['fuel_categories']
        type_base = feature_schema['type_base']
        fuel_base = feature_schema['fuel_base']
        print(f"Using provided schema with bases: type={type_base}, fuel={fuel_base}")
    
    # One-hot encode type (excluding base category)
    type_features = []
    for type_val in sorted(type_values):
        if type_val != type_base:
            feature_name = f'type_{type_val}'
            encoded_df[feature_name] = (long_df['type'] == type_val).astype(int)
            type_features.append(feature_name)
    
    # One-hot encode fuel (excluding base category)
    fuel_features = []
    for fuel_val in sorted(fuel_values):
        if fuel_val != fuel_base:
            feature_name = f'fuel_{fuel_val}'
            encoded_df[feature_name] = (long_df['fuel'] == fuel_val).astype(int)
            fuel_features.append(feature_name)
    
    # Keep numeric features as-is (interactions will be added later after scaling)
    numeric_features = ['price', 'speed', 'pollution', 'size']
    
    # Add alternative-specific constants (ASC) for positions
    # asc_alt2 through asc_alt6 (drop alt1 as base)
    asc_features = []
    for alt_id in range(2, 7):  # alternatives 2-6
        asc_name = f'asc_alt{alt_id}'
        encoded_df[asc_name] = (encoded_df['alternative_id'] == alt_id).astype(int)
        asc_features.append(asc_name)
    
    # Interactions will be created in prepare_model_data after scaling
    interaction_features = ['college_x_fuel_electric', 'hsg2_x_size', 'coml5_x_price']
    
    if feature_schema is None:
        # Build new schema
        feature_cols = type_features + fuel_features + numeric_features + asc_features + interaction_features
        feature_schema = {
            'type_base': type_base,
            'fuel_base': fuel_base,
            'type_categories': type_values,
            'fuel_categories': fuel_values,
            'type_features': type_features,
            'fuel_features': fuel_features,
            'numeric_features': numeric_features,
            'asc_features': asc_features,
            'interaction_features': interaction_features,
            'feature_cols': feature_cols
        }
    else:
        # Use schema's feature order and ensure all columns exist
        feature_cols = feature_schema['feature_cols']
        # Add missing columns with zeros (for validation/inference data)
        for col in feature_cols:
            if col not in encoded_df.columns:
                encoded_df[col] = 0.0
        # Reindex to match schema order, but preserve original columns
        original_cols = ['choice_set_id', 'alternative_id', 'choice', 'college', 'hsg2', 'coml5']
        all_cols = original_cols + feature_cols
        # Only keep columns that exist
        existing_cols = [c for c in all_cols if c in encoded_df.columns]
        encoded_df = encoded_df[existing_cols]
        # Ensure feature columns are in the right order
        for col in feature_cols:
            if col not in encoded_df.columns:
                encoded_df[col] = 0.0
    
    print(f"\nEncoded features: {feature_cols}")
    print(f"Total features: {len(feature_cols)}")
    
    return encoded_df, feature_cols, feature_schema

def prepare_model_data(long_df, feature_schema=None, scaler=None):
    """
    Prepare data for MNL model.
    For conditional logit, we need to group by choice_set_id and create arrays.
    
    If scaler is provided, applies it to numeric features.
    Interactions are computed AFTER scaling so they use scaled numerics.
    """
    # Encode categorical features (use schema if provided, otherwise create new)
    encoded_df, feature_cols, feature_schema = encode_categorical_features(long_df, feature_schema=feature_schema)
    
    # Enforce feature order from schema (critical for consistency)
    feature_cols = feature_schema['feature_cols']
    
    # Apply scaling to numeric features if scaler is provided
    numeric_features = feature_schema['numeric_features']
    if scaler is not None:
        encoded_df[numeric_features] = scaler.transform(encoded_df[numeric_features])
    
    # Create interactions AFTER scaling (so they use scaled numerics)
    # college × fuel_electric
    if 'fuel_electric' in feature_schema['fuel_features']:
        encoded_df['college_x_fuel_electric'] = (
            encoded_df['college'] * encoded_df['fuel_electric']
        ).astype(float)
    else:
        encoded_df['college_x_fuel_electric'] = 0.0
    
    # hsg2 × size (size is now scaled)
    encoded_df['hsg2_x_size'] = (
        encoded_df['hsg2'] * encoded_df['size']
    ).astype(float)
    
    # coml5 × price (price is now scaled)
    encoded_df['coml5_x_price'] = (
        encoded_df['coml5'] * encoded_df['price']
    ).astype(float)
    
    # Group by choice set
    grouped = encoded_df.groupby('choice_set_id')
    
    # Prepare arrays for model
    y_list = []  # choices for each choice set
    X_list = []  # attributes for each choice set
    choice_set_ids = []  # track choice set IDs
    
    for choice_set_id, group in grouped:
        # Sort by alternative_id to ensure consistent ordering
        group = group.sort_values('alternative_id')
        
        # Get choice vector (which alternative was chosen)
        y = group['choice'].values
        
        # Sanity check: exactly one choice per set
        assert y.sum() == 1, f"Choice set {choice_set_id} has {y.sum()} choices (expected 1)"
        
        y_list.append(y)
        
        # Get attribute matrix (features for each alternative)
        # Reindex to enforce exact feature order from schema
        X = group.reindex(columns=feature_cols, fill_value=0)[feature_cols].values.astype(float)
        
        # Check for NaNs
        if np.isnan(X).any():
            raise ValueError(f"NaN values found in choice set {choice_set_id}")
        
        X_list.append(X)
        choice_set_ids.append(choice_set_id)
    
    return y_list, X_list, feature_cols, feature_schema, choice_set_ids

def train_mnl_model(y_list, X_list, feature_names, l2_reg=L2_REGULARIZATION):
    """
    Train Conditional Logit (Multinomial Logit) model using maximum likelihood.
    
    The model estimates: U_ij = beta * X_ij
    where U_ij is the utility of alternative j in choice set i,
    and the probability is: P_ij = exp(U_ij) / sum_k(exp(U_ik))
    """
    # Verify data integrity
    choices_per_set = [y.sum() for y in y_list]
    if not all(c == 1 for c in choices_per_set):
        print("Warning: Some choice sets have multiple or zero choices!")
        print(f"Choice counts per set: {set(choices_per_set)}")
    
    print("Training Conditional Logit model using Maximum Likelihood...")
    print(f"L2 regularization: {l2_reg}")
    
    def conditional_logit_loglikelihood(beta, y_list, X_list, l2_reg):
        """
        Compute negative log-likelihood for conditional logit model with L2 regularization.
        """
        loglik = 0.0
        for y, X in zip(y_list, X_list):
            # Compute utilities for all alternatives in this choice set
            utilities = X @ beta
            
            # Compute probabilities using softmax (with numerical stability)
            max_utility = utilities.max()
            exp_utilities = np.exp(utilities - max_utility)
            probs = exp_utilities / exp_utilities.sum()
            
            # Find the chosen alternative
            chosen_idx = np.where(y == 1)[0]
            if len(chosen_idx) == 0:
                continue
            
            # Add log probability of chosen alternative
            loglik += np.log(probs[chosen_idx[0]] + 1e-10)
        
        # Add L2 regularization penalty
        l2_penalty = l2_reg * np.sum(beta ** 2)
        
        return -(loglik - l2_penalty)  # Return negative for minimization
    
    # Initial parameter values (all zeros)
    n_features = X_list[0].shape[1]
    beta_init = np.zeros(n_features)
    
    # Optimize using BFGS method
    print("Optimizing model parameters...")
    result = minimize(
        conditional_logit_loglikelihood,
        beta_init,
        args=(y_list, X_list, l2_reg),
        method='BFGS',
        options={'maxiter': 2000, 'disp': True, 'gtol': 1e-5}
    )
    
    if not result.success:
        print(f"Warning: Optimization may not have converged: {result.message}")
        print("You may want to try different initial values or optimization method.")
    
    beta_hat = result.x
    
    # Compute final log-likelihood (without regularization for reporting)
    final_ll = -conditional_logit_loglikelihood(beta_hat, y_list, X_list, 0.0)
    
    print("\n" + "=" * 60)
    print("Model Training Results")
    print("=" * 60)
    print(f"Final Log-Likelihood: {final_ll:.4f}")
    print(f"Number of Parameters: {len(beta_hat)}")
    print(f"Number of Observations: {len(y_list)}")
    print("\nModel Coefficients:")
    def sign(x):
        return "↑" if x > 0 else "↓"
    
    for name, coef in zip(feature_names, beta_hat):
        if name in ("price", "pollution", "speed", "size"):
            print(f"  {name:25s}: {coef:10.4f} {sign(coef)}")
        else:
            print(f"  {name:25s}: {coef:10.4f}")
    
    # Sign sanity check
    print("\nSign Sanity Check:")
    price_coef = beta_hat[feature_names.index('price')] if 'price' in feature_names else None
    pollution_coef = beta_hat[feature_names.index('pollution')] if 'pollution' in feature_names else None
    speed_coef = beta_hat[feature_names.index('speed')] if 'speed' in feature_names else None
    size_coef = beta_hat[feature_names.index('size')] if 'size' in feature_names else None
    
    checks = []
    if price_coef is not None:
        checks.append(f"price: {price_coef:.4f} {'✓' if price_coef < 0 else '✗'} (expect ↓)")
    if pollution_coef is not None:
        checks.append(f"pollution: {pollution_coef:.4f} {'✓' if pollution_coef < 0 else '✗'} (expect ↓)")
    if speed_coef is not None:
        checks.append(f"speed: {speed_coef:.4f} {'✓' if speed_coef > 0 else '✗'} (expect ↑)")
    if size_coef is not None:
        checks.append(f"size: {size_coef:.4f} {'✓' if size_coef >= 0 else '✗'} (expect ≥0)")
    
    for check in checks:
        print(f"  {check}")
    
    return {
        'coefficients': beta_hat,
        'feature_names': feature_names,
        'log_likelihood': final_ll,
        'n_observations': len(y_list),
        'n_parameters': len(beta_hat),
        'optimization_result': result
    }

def save_model(model, feature_schema, scaler, model_path='mnl_model.pkl'):
    """Save the trained model, feature schema, and scaler to disk."""
    save_path = Path(__file__).parent / model_path
    
    # Include feature schema and scaler in model
    model_with_schema = {
        **model,
        'feature_schema': feature_schema,
        'scaler': scaler
    }
    
    with open(save_path, 'wb') as f:
        pickle.dump(model_with_schema, f)
    print(f"\nModel saved to {save_path}")

def encode_for_inference(df_candidates, model, user_profile=None):
    """
    Encode candidate alternatives for inference.
    
    Parameters:
    -----------
    df_candidates : DataFrame
        DataFrame with columns: type, fuel, price, speed, pollution, size
        Each row is one alternative candidate
    model : dict
        Trained model with 'feature_schema' and 'scaler' keys
    user_profile : dict, optional
        User demographics with keys: college, hsg2, coml5 (defaults to 0 if not provided)
    
    Returns:
    --------
    X : array, shape (n_alternatives, n_features)
        Encoded feature matrix in exact schema order
    """
    if user_profile is None:
        user_profile = {'college': 0, 'hsg2': 0, 'coml5': 0}
    
    # Create a copy and normalize strings
    df = df_candidates.copy()
    df['type'] = df['type'].astype(str).str.strip().str.lower()
    df['fuel'] = df['fuel'].astype(str).str.strip().str.lower()
    
    # Add alternative_id (1-indexed)
    df['alternative_id'] = range(1, len(df) + 1)
    
    # Add user demographics
    df['college'] = user_profile.get('college', 0)
    df['hsg2'] = user_profile.get('hsg2', 0)
    df['coml5'] = user_profile.get('coml5', 0)
    
    # Encode using the saved schema
    schema = model['feature_schema']
    encoded_df, _, _ = encode_categorical_features(df, feature_schema=schema)
    
    # Apply scaler to numeric features
    scaler = model['scaler']
    numeric_features = schema['numeric_features']
    encoded_df[numeric_features] = scaler.transform(encoded_df[numeric_features])
    
    # Create interactions AFTER scaling (consistent with training)
    if 'fuel_electric' in schema['fuel_features']:
        encoded_df['college_x_fuel_electric'] = (
            encoded_df['college'] * encoded_df.get('fuel_electric', 0)
        ).astype(float)
    else:
        encoded_df['college_x_fuel_electric'] = 0.0
    
    encoded_df['hsg2_x_size'] = (
        encoded_df['hsg2'] * encoded_df['size']
    ).astype(float)
    
    encoded_df['coml5_x_price'] = (
        encoded_df['coml5'] * encoded_df['price']
    ).astype(float)
    
    # Reindex to exact schema order
    feature_cols = schema['feature_cols']
    X = encoded_df.reindex(columns=feature_cols, fill_value=0)[feature_cols].values.astype(float)
    
    return X

def predict_choice(model, X):
    """
    Predict choice probabilities for a set of alternatives.
    
    Parameters:
    -----------
    model : dict
        Trained model dictionary with 'coefficients' key
    X : array-like, shape (n_alternatives, n_features)
        Attribute matrix for alternatives in a choice set
    
    Returns:
    --------
    probs : array, shape (n_alternatives,)
        Probability of choosing each alternative
    """
    beta = model['coefficients']
    utilities = X @ beta
    
    # Compute probabilities using softmax
    max_utility = utilities.max()
    exp_utilities = np.exp(utilities - max_utility)
    probs = exp_utilities / exp_utilities.sum()
    
    return probs

def evaluate_model(model, y_list, X_list, split_name="Dataset"):
    """
    Evaluate model performance.
    
    Returns accuracy, average chosen probability, and other metrics.
    """
    correct = 0
    total = len(y_list)
    chosen_probs = []
    
    for y, X in zip(y_list, X_list):
        probs = predict_choice(model, X)
        predicted_idx = np.argmax(probs)
        actual_idx = np.where(y == 1)[0][0]
        
        if predicted_idx == actual_idx:
            correct += 1
        
        # Store probability of the actually chosen alternative
        chosen_probs.append(probs[actual_idx])
    
    accuracy = correct / total
    avg_chosen_prob = np.mean(chosen_probs)
    
    print(f"\n{split_name} Evaluation:")
    print(f"  Top-1 Accuracy: {accuracy:.4f} ({correct}/{total})")
    print(f"  Avg Chosen Probability: {avg_chosen_prob:.4f}")
    
    return {
        'accuracy': accuracy,
        'avg_chosen_prob': avg_chosen_prob,
        'correct': correct,
        'total': total
    }

def main():
    """Main training pipeline."""
    print("=" * 60)
    print("Multinomial Logit Model Training")
    print("=" * 60)
    
    # Load data
    df = load_data('Car.csv')
    
    # Reshape to long format (includes normalization and sanity checks)
    long_df = reshape_to_long_format(df)
    
    # Split by choice_set_id FIRST to avoid look-ahead bias
    unique_choice_sets = sorted(long_df['choice_set_id'].unique())
    train_choice_sets, val_choice_sets = train_test_split(
        unique_choice_sets,
        test_size=0.2,
        random_state=42
    )
    
    train_df = long_df[long_df['choice_set_id'].isin(train_choice_sets)].copy()
    val_df = long_df[long_df['choice_set_id'].isin(val_choice_sets)].copy()
    
    print(f"\nTrain/Validation Split:")
    print(f"  Training choice sets: {len(train_choice_sets)}")
    print(f"  Validation choice sets: {len(val_choice_sets)}")
    
    # Build feature schema from TRAIN data only
    print("\nBuilding feature schema from training data...")
    y_train, X_train, feature_names, feature_schema, train_choice_set_ids = prepare_model_data(train_df)
    
    # Fit scaler on training data only
    print("\nFitting scaler on training data...")
    # Get numeric features from encoded training data (before grouping)
    train_encoded, _, _ = encode_categorical_features(train_df, feature_schema=feature_schema)
    numeric_features = feature_schema['numeric_features']
    scaler = StandardScaler().fit(train_encoded[numeric_features])
    
    # Re-prepare training data with scaler
    y_train, X_train, feature_names, feature_schema, train_choice_set_ids = prepare_model_data(
        train_df, feature_schema=feature_schema, scaler=scaler
    )
    
    # Prepare validation data using the SAME schema and scaler
    print("\nEncoding validation data with training schema...")
    y_val, X_val, _, _, val_choice_set_ids = prepare_model_data(
        val_df, feature_schema=feature_schema, scaler=scaler
    )
    
    # Train model on training data only
    model = train_mnl_model(y_train, X_train, feature_names, l2_reg=L2_REGULARIZATION)
    
    # Evaluate on training data
    train_metrics = evaluate_model(model, y_train, X_train, split_name="Training")
    
    # Evaluate on validation data (holdout)
    val_metrics = evaluate_model(model, y_val, X_val, split_name="Validation")
    
    # Save model with feature schema and scaler
    save_model(model, feature_schema, scaler, 'mnl_model.pkl')
    
    # Export coefficients to CSV for inspection and versioning
    coefficients_df = pd.DataFrame({
        'feature': feature_names,
        'beta': model['coefficients']
    })
    coeff_path = Path(__file__).parent / 'mnl_coefficients.csv'
    coefficients_df.to_csv(coeff_path, index=False)
    print(f"\nCoefficients exported to: {coeff_path}")
    
    # Print summary
    print("\n" + "=" * 60)
    print("Training complete!")
    print("=" * 60)
    print(f"\nModel saved to: mnl_model.pkl")
    print(f"\nFeature Schema saved (for reproducibility):")
    print(f"  Type base: {feature_schema['type_base']}")
    print(f"  Fuel base: {feature_schema['fuel_base']}")
    print(f"  Total features: {len(feature_schema['feature_cols'])}")
    print(f"  Scaler saved: Yes (for numeric features: {numeric_features})")
    print(f"\nTo load and use the model:")
    print(f"  import pickle")
    print(f"  import numpy as np")
    print(f"  ")
    print(f"  with open('mnl_model.pkl', 'rb') as f:")
    print(f"      model = pickle.load(f)")
    print(f"  ")
    print(f"  # Use model['feature_schema'] and model['scaler'] to encode new data consistently")
    print(f"  # Features must match the encoded format used during training")

if __name__ == '__main__':
    main()
