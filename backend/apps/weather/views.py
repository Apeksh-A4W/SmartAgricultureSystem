from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from services.weather_service import WeatherService

from .serializers import WeatherRequestSerializer


class CurrentWeatherView(APIView):

    def get(self, request):

        lat = request.GET.get("lat")
        lon = request.GET.get("lon")

        if not lat or not lon:

            return Response(
                {"error": "Latitude and longitude are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        weather_data = WeatherService.get_current_weather(lat, lon)

        # Check if there was an error fetching data
        if "error" in weather_data:
            return Response(
                {"error": weather_data["error"]},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if API returned an error code
        if "cod" in weather_data:
            cod = weather_data.get("cod")

            if isinstance(cod, str):
                cod = int(cod)

            if cod != 200:
                return Response(
                    {
                        "error": weather_data.get(
                            "message",
                            f"Weather API error (code: {cod})"
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Check required fields
        if (
            "main" not in weather_data
            or "weather" not in weather_data
            or "wind" not in weather_data
        ):

            return Response(
                {
                    "error":
                    "Invalid response from weather service."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        response_data = {

            "location": weather_data.get("name"),

            "temperature": weather_data["main"]["temp"],

            "humidity": weather_data["main"]["humidity"],

            "pressure": weather_data["main"]["pressure"],

            "weather_condition":
                weather_data["weather"][0]["main"],

            "description":
                weather_data["weather"][0]["description"],

            "wind_speed":
                weather_data["wind"]["speed"],

            "clouds":
                weather_data["clouds"]["all"],
            "rainfall": weather_data.get("rain", {}).get("1h", 0)
        }

        return Response(response_data)

       


class ForecastWeatherView(APIView):

    def get(self, request):

        lat = request.GET.get("lat")
        lon = request.GET.get("lon")

        if not lat or not lon:

            return Response(
                {"error": "Latitude and longitude are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        forecast_data = WeatherService.get_forecast(lat, lon)

        # Check if there was an error
        if "error" in forecast_data:
            return Response(
                {"error": forecast_data["error"]},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check API response code
        if "cod" in forecast_data:

            cod = forecast_data.get("cod")

            if isinstance(cod, str):
                cod = int(cod)

            if cod != 200:
                return Response(
                    {
                        "error": forecast_data.get(
                            "message",
                            f"Weather API error (code: {cod})"
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        if "list" not in forecast_data:

            return Response(
                {"error": "Invalid forecast response"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        formatted_forecast = []

        for item in forecast_data["list"][:5]:

            formatted_forecast.append({

                "datetime": item["dt_txt"],

                "temperature": item["main"]["temp"],

                "humidity": item["main"]["humidity"],

                "weather": item["weather"][0]["main"],

                "description": item["weather"][0]["description"],

                "wind_speed": item["wind"]["speed"]
            })

        return Response({
            "city": forecast_data["city"]["name"],
            "forecast": formatted_forecast
        })

        