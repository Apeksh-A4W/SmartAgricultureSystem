import pandas as pd
import numpy as np
import joblib
import zipfile
from io import StringIO
print("TRAINING SCRIPT STARTED")
from pathlib import Path

from sklearn.model_selection import train_test_split

from sklearn.compose import ColumnTransformer

from sklearn.pipeline import Pipeline

from sklearn.preprocessing import (
    OneHotEncoder,
    StandardScaler
)

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

from lightgbm import LGBMRegressor


BASE_DIR = Path(__file__).resolve().parent

DATASET_PATH = (
    BASE_DIR /
    'datasets' /
    'crop_yield.csv'
)

MODEL_PATH = (
    BASE_DIR /
    'models' /
    'crop_yield_model.pkl'
)


print("\nLoading dataset...\n")

# Check if the file is a ZIP archive (even if it has .csv extension)
try:
    # Try to open as ZIP first
    with zipfile.ZipFile(DATASET_PATH, 'r') as zip_ref:
        # If it's a valid ZIP, read the CSV from inside
        csv_file_names = [f for f in zip_ref.namelist() if f.endswith('.csv')]
        if csv_file_names:
            with zip_ref.open(csv_file_names[0]) as csv_file:
                df = pd.read_csv(csv_file, encoding='utf-8')
        else:
            # No CSV found in ZIP, try reading the ZIP content directly
            raise ValueError("No CSV file found in ZIP archive")
except (zipfile.BadZipFile, ValueError):
    # Not a ZIP file, read as regular CSV
    df = pd.read_csv(
        DATASET_PATH,
        encoding='latin1'
    )

print(df.head())

print("\nDataset Shape:")
print(df.shape)

print("\nMissing Values:")
print(df.isnull().sum())


# FEATURES
X = df[[
    'Region',
    'Soil_Type',
    'Crop',
    'Rainfall_mm',
    'Temperature_Celsius',
    'Fertilizer_Used',
    'Irrigation_Used',
    'Weather_Condition',
    'Days_to_Harvest'
]]

# TARGET
y = df['Yield_tons_per_hectare']


# CATEGORICAL FEATURES
categorical_features = [
    'Region',
    'Soil_Type',
    'Crop',
    'Weather_Condition'
]

# NUMERICAL FEATURES
numerical_features = [
    'Rainfall_mm',
    'Temperature_Celsius',
    'Days_to_Harvest'
]

# BOOLEAN FEATURES
boolean_features = [
    'Fertilizer_Used',
    'Irrigation_Used'
]


# PREPROCESSOR
preprocessor = ColumnTransformer(

    transformers=[

        (
            'cat',

            OneHotEncoder(
                handle_unknown='ignore'
            ),

            categorical_features
        ),

        (
            'num',

            StandardScaler(),

            numerical_features
        ),

        (
            'bool',

            'passthrough',

            boolean_features
        )
    ]
)


print("\nSplitting dataset...\n")

X_train, X_test, y_train, y_test = train_test_split(

    X,
    y,

    test_size=0.2,

    random_state=42
)


print("\nTraining LightGBM Model...\n")
print("Starting model training...")

model_pipeline = Pipeline([

    ('preprocessor', preprocessor),

    ('model', LGBMRegressor(

        n_estimators=300,

        learning_rate=0.05,

        max_depth=10,

        random_state=42
    ))
])


model_pipeline.fit(
    X_train,
    y_train
)
print("Training completed")

print("\nEvaluating Model...\n")

y_pred = model_pipeline.predict(X_test)

mae = mean_absolute_error(y_test, y_pred)

mse = mean_squared_error(y_test, y_pred)

rmse = np.sqrt(mse)

r2 = r2_score(y_test, y_pred)


print("\nMODEL PERFORMANCE\n")

print(f"MAE: {mae:.4f}")

print(f"MSE: {mse:.4f}")

print(f"RMSE: {rmse:.4f}")

print(f"R2 Score: {r2:.4f}")

# ACCURACY %
accuracy = r2 * 100

print(f"Accuracy: {accuracy:.2f}%")

# TRAIN VS TEST SCORE
train_score = model_pipeline.score(X_train, y_train)

test_score = model_pipeline.score(X_test, y_test)

print(f"\nTraining Score: {train_score:.4f}")

print(f"Testing Score: {test_score:.4f}")


print("\nSaving Model...\n")

joblib.dump(
    model_pipeline,
    MODEL_PATH
)

print(f"\nModel saved to:\n{MODEL_PATH}")
