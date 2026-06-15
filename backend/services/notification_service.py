"""
Notification service for managing alert notifications
Includes geolocation-based filtering and user notification management
"""

from math import radians, sin, cos, sqrt, atan2
from django.utils import timezone
from django.db.models import Q
from apps.accounts.models import User
from apps.alerts.models import CommunityAlert, AlertNotification
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Service for managing notifications
    Handles geolocation-based alert delivery
    """
    
    ALERT_RADIUS_KM = 10  # Default radius for alert notifications
    
    @staticmethod
    def calculate_distance(lat1, lon1, lat2, lon2):
        """
        Calculate distance between two coordinates using Haversine formula
        
        Args:
            lat1, lon1: First coordinate (degrees)
            lat2, lon2: Second coordinate (degrees)
            
        Returns:
            Distance in kilometers
        """
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
        return R * c
    
    @staticmethod
    def get_nearby_users(latitude, longitude, radius_km=ALERT_RADIUS_KM):
        """
        Get all users within specified radius of coordinates
        
        Args:
            latitude, longitude: Alert coordinates
            radius_km: Search radius in kilometers
            
        Returns:
            QuerySet of User objects
        """
        
        # Get all users (in production, you'd use a geospatial database)
        # For now, we'll filter client-side
        nearby_users = []
        
        # This is a simplification - in production use GeoDjango
        # For demo, we get all users and filter in Python
        users = User.objects.filter(is_active=True)
        
        for user in users:
            # If user has a stored location, calculate distance
            # You might store user location in user profile
            if hasattr(user, 'profile') and hasattr(user.profile, 'latitude'):
                distance = NotificationService.calculate_distance(
                    latitude,
                    longitude,
                    user.profile.latitude,
                    user.profile.longitude
                )
                if distance <= radius_km:
                    nearby_users.append(user)
        
        return nearby_users
    
    @staticmethod
    def notify_nearby_users_about_alert(alert):
        """
        Send notifications to users near the alert location
        
        Args:
            alert: CommunityAlert instance
            
        Returns:
            List of AlertNotification objects created
        """
        
        try:
            # Get nearby users within 10km radius
            nearby_users = NotificationService.get_nearby_users(
                alert.latitude,
                alert.longitude,
                NotificationService.ALERT_RADIUS_KM
            )
            
            notifications_created = []
            
            for user in nearby_users:
                # Avoid notifying the alert creator
                if user == alert.user:
                    continue
                
                # Check if already notified
                existing = AlertNotification.objects.filter(
                    alert=alert,
                    user=user
                ).exists()
                
                if not existing:
                    # Create notification
                    notification = AlertNotification.objects.create(
                        alert=alert,
                        user=user
                    )
                    
                    # Queue email notification (async task)
                    from django_q.tasks import async_task
                    from tasks import send_alert_notification_task
                    async_task(send_alert_notification_task, user_id=user.id, alert_id=alert.id)
                    
                    notifications_created.append(notification)
                    logger.info(f"Created notification for user {user.id} about alert {alert.id}")
            
            return notifications_created
            
        except Exception as e:
            logger.error(f"Error notifying users about alert {alert.id}: {str(e)}")
            return []
    
    @staticmethod
    def mark_alert_as_read_by_user(alert, user):
        """
        Mark alert as read by a user and update notification
        
        Args:
            alert: CommunityAlert instance
            user: User instance
        """
        
        alert.mark_as_read_by(user)
        
        # Update notification read_at timestamp
        try:
            notification = AlertNotification.objects.get(alert=alert, user=user)
            notification.read_at = timezone.now()
            notification.save()
            logger.info(f"Alert {alert.id} marked as read by user {user.id}")
        except AlertNotification.DoesNotExist:
            pass
    
    @staticmethod
    def dismiss_alert_for_user(alert, user):
        """
        Dismiss alert for a user (remove from their feed)
        
        Args:
            alert: CommunityAlert instance
            user: User instance
        """
        
        alert.dismiss_for_user(user)
        logger.info(f"Alert {alert.id} dismissed for user {user.id}")
    
    @staticmethod
    def get_unread_alerts_for_user(user):
        """
        Get unread alerts for a user that haven't been dismissed
        
        Args:
            user: User instance
            
        Returns:
            QuerySet of unread CommunityAlert objects
        """
        
        # Get active, non-expired alerts that weren't dismissed by user
        unread_alerts = CommunityAlert.objects.filter(
            Q(is_active=True) &
            Q(expires_at__gt=timezone.now()) &
            ~Q(dismissed_by_users=user)
        ).exclude(user=user)
        
        return unread_alerts.order_by('-created_at')
    
    @staticmethod
    def get_user_location_from_alerts(user):
        """
        Infer user location from their recent alerts
        Used for geolocation matching if user location isn't explicitly stored
        
        Args:
            user: User instance
            
        Returns:
            Tuple of (latitude, longitude) or None
        """
        
        recent_alert = user.community_alerts.filter(
            created_at__gte=timezone.now() - timezone.timedelta(days=30)
        ).order_by('-created_at').first()
        
        if recent_alert:
            return (recent_alert.latitude, recent_alert.longitude)
        
        return None
