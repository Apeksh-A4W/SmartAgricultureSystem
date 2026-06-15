from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from math import radians, sin, cos, sqrt, atan2
from django.db.models import Count, Q
from django.utils import timezone

from .models import CommunityAlert, AlertNotification
from .serializers import CommunityAlertSerializer
from services.notification_service import NotificationService
import logging

logger = logging.getLogger(__name__)


def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates using Haversine formula"""
    R = 6371  # Earth radius in km
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = (
        sin(dlat / 2) ** 2 +
        cos(radians(lat1)) *
        cos(radians(lat2)) *
        sin(dlon / 2) ** 2
    )
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    distance = R * c
    return distance


class ReportAlertView(APIView):
    """Report a new alert"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = CommunityAlertSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            alert = serializer.save(user=request.user)
            
            # Notify nearby users asynchronously
            NotificationService.notify_nearby_users_about_alert(alert)

            return Response({
                "message": "Alert reported successfully",
                "alert": serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class NearbyAlertsView(APIView):
    """Get nearby alerts within 10km radius"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_lat = request.GET.get('latitude')
        user_lon = request.GET.get('longitude')
        
        if not user_lat or not user_lon:
            return Response({
                "error": "latitude and longitude are required"
            }, status=status.HTTP_400_BAD_REQUEST)

        alert_type = request.GET.get('type')
        severity = request.GET.get('severity')
        radius_km = int(request.GET.get('radius', 10))

        # Get active, non-expired alerts
        alerts = CommunityAlert.objects.filter(
            is_active=True,
            expires_at__gt=timezone.now()
        )

        filtered_alerts = []

        for alert in alerts:
            # Skip if user dismissed this alert
            if alert.dismissed_by_users.filter(id=request.user.id).exists():
                continue

            distance = calculate_distance(
                float(user_lat),
                float(user_lon),
                alert.latitude,
                alert.longitude
            )

            if distance <= radius_km:
                filtered_alerts.append(alert)

        # Filter by type
        if alert_type:
            filtered_alerts = [
                alert for alert in filtered_alerts
                if alert.alert_type == alert_type
            ]

        # Filter by severity
        if severity:
            filtered_alerts = [
                alert for alert in filtered_alerts
                if alert.severity == severity
            ]

        serializer = CommunityAlertSerializer(
            filtered_alerts,
            many=True,
            context={'request': request}
        )

        return Response({
            "radius_km": radius_km,
            "count": len(filtered_alerts),
            "alerts": serializer.data
        })


class AlertDetailView(APIView):
    """Get, update, or delete a specific alert"""
    permission_classes = [IsAuthenticated]

    def get(self, request, alert_id):
        try:
            alert = CommunityAlert.objects.get(id=alert_id)
            
            # Mark as read
            NotificationService.mark_alert_as_read_by_user(alert, request.user)
            
            serializer = CommunityAlertSerializer(alert, context={'request': request})
            return Response(serializer.data)
        except CommunityAlert.DoesNotExist:
            return Response({
                "error": "Alert not found"
            }, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, alert_id):
        try:
            alert = CommunityAlert.objects.get(id=alert_id, user=request.user)
            alert.delete()
            return Response({
                "message": "Alert deleted successfully"
            })
        except CommunityAlert.DoesNotExist:
            return Response({
                "error": "Alert not found or you don't have permission to delete it"
            }, status=status.HTTP_404_NOT_FOUND)


class DismissAlertView(APIView):
    """Dismiss an alert for the current user"""
    permission_classes = [IsAuthenticated]

    def post(self, request, alert_id):
        try:
            alert = CommunityAlert.objects.get(id=alert_id)
            NotificationService.dismiss_alert_for_user(alert, request.user)
            
            return Response({
                "message": "Alert dismissed successfully"
            })
        except CommunityAlert.DoesNotExist:
            return Response({
                "error": "Alert not found"
            }, status=status.HTTP_404_NOT_FOUND)


class UserAlertsView(APIView):
    """Get alerts reported by the current user"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        alerts = CommunityAlert.objects.filter(
            user=request.user
        ).order_by('-created_at')
        
        serializer = CommunityAlertSerializer(
            alerts,
            many=True,
            context={'request': request}
        )
        
        return Response({
            "count": alerts.count(),
            "alerts": serializer.data
        })


class AlertAnalyticsView(APIView):
    """Get alert statistics"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Overall stats
        all_alerts = CommunityAlert.objects.filter(is_active=True)
        total = all_alerts.count()
        danger = all_alerts.filter(severity='DANGER').count()
        warning = all_alerts.filter(severity='WARNING').count()
        safe = all_alerts.filter(severity='SAFE').count()
        
        # User's unread alerts
        unread_alerts = NotificationService.get_unread_alerts_for_user(request.user)
        unread_count = unread_alerts.count()

        return Response({
            "total": total,
            "danger": danger,
            "warning": warning,
            "safe": safe,
            "user_unread_count": unread_count,
            "breakdown": {
                "pest": all_alerts.filter(alert_type='PEST').count(),
                "animal": all_alerts.filter(alert_type='ANIMAL').count(),
                "disease": all_alerts.filter(alert_type='DISEASE').count(),
                "weather": all_alerts.filter(alert_type='WEATHER').count()
            }
        })
