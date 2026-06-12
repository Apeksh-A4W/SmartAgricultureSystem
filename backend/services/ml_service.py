import joblib
import pandas as pd

from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = (
    BASE_DIR /
    'ml' /
    'models' /
    'crop_yield_model.pkl'
)


print("\nLOADING ML MODEL...\n")

model = joblib.load(MODEL_PATH)

print("\nML MODEL LOADED SUCCESSFULLY\n")


class MLService:

    @staticmethod   //data fields
    def predict_crop_yield(data):

        input_df = pd.DataFrame([{

            'Region': data['region'],

            'Soil_Type': data['soil_type'],

            'Crop': data['crop'],

            'Rainfall_mm': data['rainfall_mm'],

            'Temperature_Celsius': data['temperature_celsius'],

            'Fertilizer_Used': data['fertilizer_used'],

            'Irrigation_Used': data['irrigation_used'],

            'Weather_Condition': data['weather_condition'],

            'Days_to_Harvest': data['days_to_harvest']
        }])

        prediction = model.predict(input_df)[0]

        return round(
            float(prediction),
            2
        )
