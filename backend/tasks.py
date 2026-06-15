"""
Django-Q async tasks for background job processing
Handles email sending, notifications, and scheduled jobs
"""

from django.utils import timezone
from django.utils.timezone import now
from datetime import timedelta
from django.template.loader import render_to_string
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import logging
from django_q.tasks import async_task
logger = logging.getLogger(__name__)


# ==================== EMAIL TASK FUNCTIONS ====================

def send_email_verification_task(user_id, verification_link):
    """
    Send email verification email asynchronously
    
    Args:
        user_id: ID of user to verify
        verification_link: Verification URL
    """
    from apps.accounts.models import User
    from services.email_service import EmailService
    
    try:
        user = User.objects.get(id=user_id)
        language = user.preferred_language or 'en'
        EmailService.send_verification_email(user, verification_link, language)
        logger.info(f"Verification email sent to user {user_id}")
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for verification email")
    except Exception as e:
        logger.error(f"Failed to send verification email: {str(e)}")


def send_password_reset_task(user_id, reset_link):
    """
    Send password reset email asynchronously
    
    Args:
        user_id: ID of user requesting password reset
        reset_link: Password reset URL
    """
    from apps.accounts.models import User
    from services.email_service import EmailService
    
    try:
        user = User.objects.get(id=user_id)
        language = user.preferred_language or 'en'
        EmailService.send_password_reset_email(user, reset_link, language)
        logger.info(f"Password reset email sent to user {user_id}")
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for password reset email")
    except Exception as e:
        logger.error(f"Failed to send password reset email: {str(e)}")


def send_alert_notification_task(user_id, alert_id):
    """
    Send alert notification email to user
    
    Args:
        user_id: ID of user to notify
        alert_id: ID of alert
    """
    from apps.accounts.models import User
    from apps.alerts.models import CommunityAlert
    from services.email_service import EmailService
    
    try:
        user = User.objects.get(id=user_id)
        alert = CommunityAlert.objects.get(id=alert_id)
        
        alert_data = {
            'type': alert.get_alert_type_display(),
            'severity': alert.severity,
            'description': alert.description,
            'distance': 'nearby',  # Could calculate actual distance
            'created_at': alert.created_at,
        }
        
        language = user.preferred_language or 'en'
        EmailService.send_alert_notification_email(user, alert_data, language)
        logger.info(f"Alert notification sent to user {user_id} about alert {alert_id}")
    except (User.DoesNotExist, CommunityAlert.DoesNotExist) as e:
        logger.error(f"Error sending alert notification: {str(e)}")
    except Exception as e:
        logger.error(f"Failed to send alert notification: {str(e)}")


# ==================== REPORT TASKS ====================

#@shared_task
def send_weekly_reports_task():
    """
    Send weekly crop/yield summary emails to all users
    Scheduled to run every Monday at 8 AM
    """
    from apps.accounts.models import User
    from apps.reports.models import WeeklyReport
    from services.email_service import EmailService
    
    try:
        users = User.objects.filter(is_active=True, is_email_verified=True)
        
        for user in users:
            try:
                # Get latest report for user
                latest_report = WeeklyReport.objects.filter(
                    user=user
                ).order_by('-created_at').first()
                
                if latest_report:
                    report_data = {
                        'title': latest_report.title,
                        'crop_name': latest_report.crop_name,
                        'predicted_yield': latest_report.predicted_yield,
                        'weather_summary': latest_report.weather_summary,
                        'alert_summary': latest_report.alert_summary,
                        'recommendations': latest_report.ai_recommendations,
                        'risk_level': latest_report.risk_level,
                    }
                    
                    language = user.preferred_language or 'en'
                    EmailService.send_weekly_report_email(user, report_data, language)
                    logger.info(f"Weekly report email sent to user {user.id}")
            except Exception as e:
                logger.error(f"Failed to send weekly report to user {user.id}: {str(e)}")
        
        logger.info("Weekly report emails completed")
    except Exception as e:
        logger.error(f"Failed to send weekly reports: {str(e)}")


#@shared_task
def send_daily_recommendations_task():
    """
    Send 15-day farming recommendations to users
    Scheduled to run daily at 9 AM
    """
    from apps.accounts.models import User
    from apps.recommendations.models import Recommendation
    from services.email_service import EmailService
    
    try:
        users = User.objects.filter(is_active=True, is_email_verified=True)
        
        for user in users:
            try:
                # Get recent recommendations for user
                recommendations = Recommendation.objects.filter(
                    user=user,
                    created_at__gte=now() - timedelta(days=1)
                ).order_by('-created_at')[:5]
                
                if recommendations.exists():
                    rec_data = [
                        {
                            'title': r.title if hasattr(r, 'title') else str(r),
                            'description': r.description if hasattr(r, 'description') else '',
                            'priority': r.priority if hasattr(r, 'priority') else 'medium',
                        }
                        for r in recommendations
                    ]
                    
                    language = user.preferred_language or 'en'
                    EmailService.send_recommendation_email(user, rec_data, language)
                    logger.info(f"Recommendation email sent to user {user.id}")
            except Exception as e:
                logger.error(f"Failed to send recommendations to user {user.id}: {str(e)}")
        
        logger.info("Daily recommendation emails completed")
    except Exception as e:
        logger.error(f"Failed to send daily recommendations: {str(e)}")


# ==================== ALERT MAINTENANCE TASKS ====================

#@shared_task
def cleanup_expired_alerts_task():
    """
    Auto-delete alerts that have expired (older than 7 days)
    Scheduled to run daily at midnight
    """
    from apps.alerts.models import CommunityAlert
    
    try:
        cutoff_time = timezone.now() - timedelta(days=7)
        expired_alerts = CommunityAlert.objects.filter(
            is_active=True,
            expires_at__lt=cutoff_time
        )
        
        count = expired_alerts.count()
        expired_alerts.update(is_active=False)
        
        logger.info(f"Deactivated {count} expired alerts")
    except Exception as e:
        logger.error(f"Failed to cleanup expired alerts: {str(e)}")


#@shared_task
def deactivate_dismissed_alerts_task():
    """
    Deactivate alerts that have been dismissed by most users
    Optional maintenance task
    """
    from apps.alerts.models import CommunityAlert
    from django.db.models import Count, Q
    
    try:
        # Find alerts dismissed by 80% of potential recipients
        alerts = CommunityAlert.objects.filter(
            is_active=True,
            expires_at__gt=timezone.now()
        ).annotate(
            dismiss_count=Count('dismissed_by_users')
        ).filter(
            dismiss_count__gte=20  # At least 20 users dismissed
        )
        
        count = alerts.update(is_active=False)
        logger.info(f"Deactivated {count} heavily dismissed alerts")
    except Exception as e:
        logger.error(f"Failed to deactivate dismissed alerts: {str(e)}")


# ==================== PDF GENERATION TASK ====================

#@shared_task
def generate_and_send_report_pdf_task(user_id, report_id):
    """
    Generate PDF report and send via email
    Called when user clicks "Send Report"
    
    Args:
        user_id: ID of user requesting report
        report_id: ID of report to send
    """
    from apps.accounts.models import User
    from apps.reports.models import WeeklyReport, ReportHistory
    from services.email_service import EmailService
    import tempfile
    
    try:
        user = User.objects.get(id=user_id)
        report = WeeklyReport.objects.get(id=report_id, user=user)
        
        # Generate PDF
        pdf_buffer = BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter)
        story = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor='#2c5f4f',
            spaceAfter=30,
            alignment=1
        )
        story.append(Paragraph(report.title, title_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Content
        content_style = styles['BodyText']
        
        # Crop Name
        story.append(Paragraph(f"<b>Crop:</b> {report.crop_name}", content_style))
        story.append(Paragraph(f"<b>Predicted Yield:</b> {report.predicted_yield} units", content_style))
        story.append(Paragraph(f"<b>Risk Level:</b> {report.risk_level}", content_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Weather Summary
        story.append(Paragraph("<b>Weather Summary:</b>", styles['Heading2']))
        story.append(Paragraph(report.weather_summary, content_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Alert Summary
        story.append(Paragraph("<b>Alert Summary:</b>", styles['Heading2']))
        story.append(Paragraph(report.alert_summary, content_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Recommendations
        story.append(Paragraph("<b>AI Recommendations:</b>", styles['Heading2']))
        for rec in report.ai_recommendations:
            story.append(Paragraph(f"• {rec}", content_style))
        
        # Build PDF
        doc.build(story)
        pdf_buffer.seek(0)
        
        # Save temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            tmp_file.write(pdf_buffer.getvalue())
            tmp_path = tmp_file.name
        
        # Send email with attachment
        language = user.preferred_language or 'en'
        EmailService.send_report_attachment_email(
            user,
            tmp_path,
            report.title,
            language
        )
        
        # Log action
        ReportHistory.objects.create(
            user=user,
            report=report,
            action='emailed'
        )
        
        # Cleanup temp file
        import os
        os.unlink(tmp_path)
        
        logger.info(f"Report PDF generated and sent to user {user_id}")
        
    except (User.DoesNotExist, WeeklyReport.DoesNotExist) as e:
        logger.error(f"Error generating report: {str(e)}")
    except Exception as e:
        logger.error(f"Failed to generate and send report PDF: {str(e)}")


# ==================== TOKEN CLEANUP TASKS ====================

#@shared_task
def cleanup_expired_tokens_task():
    """
    Delete expired email verification and password reset tokens
    Scheduled to run daily
    """
    from apps.accounts.models import EmailVerificationToken, PasswordResetToken
    
    try:
        cutoff_time = timezone.now()
        
        # Delete expired verification tokens
        deleted_verify = EmailVerificationToken.objects.filter(
            expires_at__lt=cutoff_time
        ).delete()[0]
        
        # Delete expired and used password reset tokens
        deleted_reset = PasswordResetToken.objects.filter(
            expires_at__lt=cutoff_time
        ).delete()[0]
        
        logger.info(f"Cleanup: Deleted {deleted_verify} verification tokens and {deleted_reset} reset tokens")
    except Exception as e:
        logger.error(f"Failed to cleanup expired tokens: {str(e)}")
