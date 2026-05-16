from rest_framework.views import APIView

from rest_framework.response import Response

from rest_framework.permissions import (
    IsAuthenticated
)

from .models import WeeklyReport

from .serializers import (
    WeeklyReportSerializer
)

from apps.predictions.models import (
    CropPrediction
)

from apps.alerts.models import (
    CommunityAlert
)

from services.recommendation_engine import (
    generate_recommendations
)


class GenerateWeeklyReportView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        latest_prediction = (
            CropPrediction.objects
            .filter(user=request.user)
            .first()
        )

        if not latest_prediction:

            return Response({

                "error": (
                    "No predictions found"
                )

            }, status=404)

        alerts = CommunityAlert.objects.filter(
            user=request.user
        )[:5]

        alert_summary = (

            f"{alerts.count()} active alerts nearby"
        )

        weather_summary = (
            "Weather conditions monitored"
        )

        recommendations = (
            generate_recommendations(

                predicted_yield=(
                    latest_prediction.predicted_yield
                ),

                temperature=(
                    latest_prediction.temperature_celsius
                ),

                humidity=70,

                weather_condition=(
                    latest_prediction.weather_condition
                )
            )
        )

        risk_level = "LOW"

        if latest_prediction.predicted_yield < 3:

            risk_level = "HIGH"

        report = WeeklyReport.objects.create(

            user=request.user,

            title="Weekly Farm Report",

            crop_name=latest_prediction.crop,

            predicted_yield=(
                latest_prediction.predicted_yield
            ),

            weather_summary=weather_summary,

            alert_summary=alert_summary,

            ai_recommendations=recommendations,

            risk_level=risk_level
        )

        serializer = WeeklyReportSerializer(report)

        return Response({

            "message": (
                "Weekly report generated"
            ),

            "report": serializer.data
        })


class WeeklyReportHistoryView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        reports = WeeklyReport.objects.filter(
            user=request.user
        )

        serializer = WeeklyReportSerializer(

            reports,
            many=True
        )

        return Response({

            "count": reports.count(),

            "reports": serializer.data
        })