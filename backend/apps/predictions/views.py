from rest_framework.views import APIView

from rest_framework.response import Response
from django.db.models import Avg
from django.db.models import Count
from rest_framework.permissions import IsAuthenticated

from rest_framework import status

from services.ml_service import MLService

from services.recommendation_service import (
    RecommendationService
)

from .models import CropPrediction

from .serializers import CropPredictionSerializer


class CropPredictionView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = CropPredictionSerializer(
            data=request.data
        )

        if serializer.is_valid():

            data = serializer.validated_data

            prediction = MLService.predict_crop_yield({

                "region": data['region'],

                "soil_type": data['soil_type'],

                "crop": data['crop'],

                "rainfall_mm": data['rainfall_mm'],

                "temperature_celsius": data['temperature_celsius'],

                "fertilizer_used": data['fertilizer_used'],

                "irrigation_used": data['irrigation_used'],

                "weather_condition": data['weather_condition'],

                "days_to_harvest": data['days_to_harvest']
            })

            recommendations = (
                RecommendationService.generate_recommendations(
                    data,
                    prediction
                )
            )

            crop_prediction = CropPrediction.objects.create(

                user=request.user,

                region=data['region'],

                soil_type=data['soil_type'],

                crop=data['crop'],

                rainfall_mm=data['rainfall_mm'],

                temperature_celsius=data['temperature_celsius'],

                fertilizer_used=data['fertilizer_used'],

                irrigation_used=data['irrigation_used'],

                weather_condition=data['weather_condition'],

                days_to_harvest=data['days_to_harvest'],

                predicted_yield=prediction
            )

            return Response({

                "message": "Prediction successful",

                "prediction": {

                    "predicted_yield": prediction,

                    "unit": "tons/hectare"
                },

                "recommendations": recommendations,

                "prediction_id": crop_prediction.id
            })

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
class PredictionHistoryView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        predictions = CropPrediction.objects.filter(
            user=request.user
        )

        serializer = CropPredictionSerializer(
            predictions,
            many=True
        )

        return Response({

            "count": predictions.count(),

            "results": serializer.data
        })


class PredictionAnalyticsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        predictions = CropPrediction.objects.filter(
            user=request.user
        )

        total_predictions = predictions.count()

        average_yield = predictions.aggregate(
            Avg('predicted_yield')
        )['predicted_yield__avg']

        highest_yield = predictions.order_by(
            '-predicted_yield'
        ).first()

        lowest_yield = predictions.order_by(
            'predicted_yield'
        ).first()

        return Response({

            "total_predictions": total_predictions,

            "average_yield": round(
                average_yield or 0,
                2
            ),

            "highest_prediction": {

                "crop": (
                    highest_yield.crop
                    if highest_yield else None
                ),

                "yield": (
                    highest_yield.predicted_yield
                    if highest_yield else None
                )
            },

            "lowest_prediction": {

                "crop": (
                    lowest_yield.crop
                    if lowest_yield else None
                ),

                "yield": (
                    lowest_yield.predicted_yield
                    if lowest_yield else None
                )
            }
        })


class YieldTrendView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        predictions = CropPrediction.objects.filter(
            user=request.user
        ).order_by('created_at')

        trend_data = []

        for prediction in predictions:

            trend_data.append({

                "date": prediction.created_at.strftime(
                    "%Y-%m-%d"
                ),

                "crop": prediction.crop,

                "yield": prediction.predicted_yield
            })

        return Response({

            "trend_data": trend_data
        })


class CropStatisticsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        crop_stats = (

            CropPrediction.objects
            .filter(user=request.user)
            .values('crop')
            .annotate(count=Count('crop'))
            .order_by('-count')
        )

        return Response({

            "crop_statistics": list(crop_stats)
        })