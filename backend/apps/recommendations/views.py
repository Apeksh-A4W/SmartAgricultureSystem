from rest_framework.views import APIView

from rest_framework.response import Response

from rest_framework.permissions import (
    IsAuthenticated
)

from services.market_service import (
    MarketPriceService
)


class LiveMarketPriceView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):

        crop = request.GET.get(
            'crop'
        )

        data = (
            MarketPriceService
            .get_prices(crop)
        )

        return Response(data)


class FarmingAdviceView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def post(self, request):

        nitrogen = float(
            request.data.get(
                "nitrogen",
                0
            )
        )

        phosphorus = float(
            request.data.get(
                "phosphorus",
                0
            )
        )

        potassium = float(
            request.data.get(
                "potassium",
                0
            )
        )

        weather = request.data.get(
            "weather",
            ""
        )

        prediction = float(
            request.data.get(
                "prediction",
                0
            )
        )

        recommendations = []

        if nitrogen < 20:

            recommendations.append(
                "Nitrogen is low. Use urea or compost."
            )

        if phosphorus < 20:

            recommendations.append(
                "Phosphorus deficiency detected."
            )

        if potassium < 20:

            recommendations.append(
                "Add potassium-rich fertilizer."
            )

        if weather == "Rainy":

            recommendations.append(
                "Heavy rain expected. Avoid over-irrigation."
            )

        if prediction < 2:

            recommendations.append(
                "Predicted yield is low. Improve irrigation and nutrient management."
            )

        if not recommendations:

            recommendations.append(
                "Crop conditions look healthy."
            )

        return Response({

            "recommendations":
                recommendations
        })