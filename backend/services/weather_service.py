import requests
import os

from dotenv import load_dotenv
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent

env_path = BASE_DIR / '.env'

load_dotenv(dotenv_path=env_path)

API_KEY = os.getenv("OPENWEATHER_API_KEY")


class WeatherService:

    BASE_URL = "https://api.openweathermap.org/data/2.5"

    @staticmethod
    def get_current_weather(lat, lon):

        if not API_KEY:
            return {
                "error": "OPENWEATHER_API_KEY not configured in environment"
            }

        url = f"{WeatherService.BASE_URL}/weather"

        params = {
            "lat": lat,
            "lon": lon,
            "appid": API_KEY,
            "units": "metric"
        }

        try:

            response = requests.get(
                url,
                params=params,
                timeout=10
            )

            data = response.json()

            return data

        except Exception as e:

            return {
                "error": f"Failed to fetch weather data: {str(e)}"
            }

    @staticmethod
    def get_forecast(lat, lon):

        if not API_KEY:
            return {
                "error": "OPENWEATHER_API_KEY not configured in environment"
            }

        url = f"{WeatherService.BASE_URL}/forecast"

        params = {
            "lat": lat,
            "lon": lon,
            "appid": API_KEY,
            "units": "metric"
        }

        try:

            response = requests.get(
                url,
                params=params,
                timeout=10
            )

            data = response.json()

            return data

        except Exception as e:

            return {
                "error": f"Failed to fetch forecast data: {str(e)}"
            }