from rest_framework.views import APIView

from rest_framework.response import Response

from rest_framework.permissions import IsAuthenticated
from math import radians
from math import sin
from math import cos
from math import sqrt
from math import atan2
from rest_framework.parsers import (
    MultiPartParser,
    FormParser
)

from django.db.models import Count

from .models import CommunityAlert

from .serializers import (
    CommunityAlertSerializer
)


class ReportAlertView(APIView):

    permission_classes = [IsAuthenticated]

    parser_classes = [
        MultiPartParser,
        FormParser
    ]

    def post(self, request):

        serializer = CommunityAlertSerializer(

            data=request.data,

            context={
                'request': request
            }
        )

        if serializer.is_valid():

            serializer.save(
                user=request.user
            )

            return Response({

                "message": (
                    "Alert reported successfully"
                ),

                "alert": serializer.data
            })

        return Response(
            serializer.errors,
            status=400
        )
def calculate_distance(

    lat1,
    lon1,
    lat2,
    lon2
):

    R = 6371

    dlat = radians(lat2 - lat1)

    dlon = radians(lon2 - lon1)

    a = (

        sin(dlat / 2) ** 2 +

        cos(radians(lat1)) *

        cos(radians(lat2)) *

        sin(dlon / 2) ** 2
    )

    c = 2 * atan2(
        sqrt(a),
        sqrt(1 - a)
    )

    distance = R * c

    return distance

class NearbyAlertsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        user_lat = request.GET.get(
            'latitude'
        )

        user_lon = request.GET.get(
            'longitude'
        )
        if not user_lat or not user_lon:

            return Response({

                "error": (
                "latitude and longitude "
                "are required"
            )

        }, status=400)
        alert_type = request.GET.get(
            'type'
        )

        severity = request.GET.get(
            'severity'
        )

        radius_km = 10

        alerts = CommunityAlert.objects.filter(
            is_active=True
        )

        filtered_alerts = []

        for alert in alerts:

            distance = calculate_distance(

                float(user_lat),

                float(user_lon),

                alert.latitude,

                alert.longitude
            )

            if distance <= radius_km:

                filtered_alerts.append(alert)

        if alert_type:

            filtered_alerts = [

                alert for alert in filtered_alerts

                if alert.alert_type == alert_type
            ]

        if severity:

            filtered_alerts = [

                alert for alert in filtered_alerts

                if alert.severity == severity
            ]

        serializer = CommunityAlertSerializer(

            filtered_alerts,

            many=True,

            context={
                'request': request
            }
        )

        return Response({

            "radius_km": radius_km,

            "count": len(filtered_alerts),

            "alerts": serializer.data
        })

class AlertAnalyticsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        total = CommunityAlert.objects.count()

        danger = CommunityAlert.objects.filter(
            severity='DANGER'
        ).count()

        warning = CommunityAlert.objects.filter(
            severity='WARNING'
        ).count()

        safe = CommunityAlert.objects.filter(
            severity='SAFE'
        ).count()

        return Response({

            "total": total,

            "danger": danger,

            "warning": warning,

            "safe": safe
        })