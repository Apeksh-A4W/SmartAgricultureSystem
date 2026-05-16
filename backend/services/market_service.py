import requests
import os


API_KEY = os.getenv("DATA_GOV_API_KEY")


class MarketPriceService:

    BASE_URL = (
        "https://api.data.gov.in/resource/"
        "9ef84268-d588-465a-a308-a864a43d0070"
    )

    SAMPLE_DATA = {

        "prices": [

            {
                "crop": "Rice",
                "price": 2100,
                "change": "+2.4%"
            },

            {
                "crop": "Wheat",
                "price": 1900,
                "change": "+1.1%"
            },

            {
                "crop": "Maize",
                "price": 1750,
                "change": "-0.8%"
            },

            {
                "crop": "Cotton",
                "price": 6200,
                "change": "+3.5%"
            }
        ],

        "source": "fallback_data"
    }

    @staticmethod
    def get_prices(crop=None):

        params = {

            "api-key": API_KEY,

            "format": "json",

            "limit": 10
        }

        if crop:

            params["filters[commodity]"] = crop

        try:

            response = requests.get(

                MarketPriceService.BASE_URL,

                params=params,

                timeout=15
            )

            response.raise_for_status()

            data = response.json()

            return {
                "source": "live_api",
                "data": data
            }

        except Exception:

            return MarketPriceService.SAMPLE_DATA