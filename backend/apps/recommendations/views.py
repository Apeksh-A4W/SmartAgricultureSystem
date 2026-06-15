from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from services.market_service import MarketPriceService
from services.recommendation_engine import generate_recommendations


class LiveMarketPriceView(APIView):
    """API endpoint for live market prices with caching and fallback."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get market prices for all crops or specific crop."""
        try: 
            crop = request.GET.get('crop')
            data = MarketPriceService.get_prices(crop)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e), "prices": []},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FarmingAdviceView(APIView):
    """API endpoint for professional farming recommendations."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Generate recommendations based on soil nutrients, weather, and predictions."""
        try:
            # Extract input parameters with defaults
            nitrogen = float(request.data.get("nitrogen", 0))
            phosphorus = float(request.data.get("phosphorus", 0))
            potassium = float(request.data.get("potassium", 0))
            temperature = float(request.data.get("temperature", 25))
            humidity = float(request.data.get("humidity", 60))
            rainfall = float(request.data.get("rainfall", 100))
            predicted_yield = float(request.data.get("prediction", request.data.get("predicted_yield", 2.5)))
            weather = request.data.get("weather", "Sunny")
            crop_type = request.data.get("crop", "rice")
            soil_type = request.data.get("soil_type", "loamy")
            irrigation_used = int(request.data.get("irrigation_used", 1))

            # Generate professional recommendations
            recommendations = generate_recommendations(
                nitrogen=nitrogen,
                phosphorus=phosphorus,
                potassium=potassium,
                temperature=temperature,
                humidity=humidity,
                rainfall=rainfall,
                predicted_yield=predicted_yield,
                weather_condition=weather,
                crop_type=crop_type,
                soil_type=soil_type,
                irrigation_used=irrigation_used
            )

            return Response({
                "recommendations": recommendations,
                "count": len(recommendations),
                "analysis_date": None
            }, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response(
                {"error": f"Invalid input format: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )