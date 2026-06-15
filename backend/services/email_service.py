"""
Email service module for sending templated emails
Supports HTML email with translations
"""

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from apps.reports.models import EmailLog
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """
    Service for sending emails with templates
    Supports multi-language email content
    """
    
    @staticmethod
    def send_verification_email(user, verification_link, language='en'):
        """
        Send email verification email
        
        Args:
            user: User instance
            verification_link: Full URL to verification endpoint
            language: User preferred language (en, kn, hi)
        """
        
        template_context = {
            'user': user,
            'verification_link': verification_link,
            'language': language,
        }
        
        translations = {
            'en': {
                'subject': 'Verify Your Email Address',
                'button_text': 'Verify Email',
                'message': 'Thank you for signing up! Please verify your email address to complete your registration.',
            },
            'kn': {
                'subject': 'ನಿಮ್ಮ ಇಮೇಲ್ ವಿಳಾಸ ಪರಿಶೀಲಿಸಿ',
                'button_text': 'ಇಮೇಲ್ ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ',
                'message': 'ಸೈನ್ ಅಪ್ ಮಾಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದ! ನಿಮ್ಮ ನೋಂದಣಿಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ಇಮೇಲ್ ವಿಳಾಸ ಪರಿಶೀಲಿಸಿ.',
            },
            'hi': {
                'subject': 'अपने ईमेल पते को सत्यापित करें',
                'button_text': 'ईमेल सत्यापित करें',
                'message': 'साइन अप करने के लिए धन्यवाद! अपनी पंजीकरण को पूरा करने के लिए कृपया अपने ईमेल पते को सत्यापित करें।',
            }
        }
        
        trans = translations.get(language, translations['en'])
        template_context.update(trans)
        
        return EmailService._send_email(
            user.email,
            trans['subject'],
            'emails/verification.html',
            template_context,
            'verification'
        )
    
    @staticmethod
    def send_password_reset_email(user, reset_link, language='en'):
        """
        Send password reset email
        
        Args:
            user: User instance
            reset_link: Full URL to password reset endpoint
            language: User preferred language
        """
        
        template_context = {
            'user': user,
            'reset_link': reset_link,
            'language': language,
        }
        
        translations = {
            'en': {
                'subject': 'Reset Your Password',
                'button_text': 'Reset Password',
                'message': 'We received a request to reset your password. Click the button below to create a new password.',
                'expiry': 'This link expires in 1 hour.',
            },
            'kn': {
                'subject': 'ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ರೀಸೆಟ್ ಮಾಡಿ',
                'button_text': 'ಪಾಸ್‌ವರ್ಡ್ ರೀಸೆಟ್ ಮಾಡಿ',
                'message': 'ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ಅನ್ನು ಮರುಹೊಂದಿಸುವ ವಿನಂತಿ ನಾವು ಸ್ವೀಕರಿಸಿದ್ದೇವೆ.',
                'expiry': 'ಈ ಲಿಂಕ್ 1 ಗಂಟೆಯಲ್ಲಿ ಕೊನೆಗೊಳ್ಳುತ್ತದೆ.',
            },
            'hi': {
                'subject': 'अपना पासवर्ड रीसेट करें',
                'button_text': 'पासवर्ड रीसेट करें',
                'message': 'हमने आपके पासवर्ड को रीसेट करने का अनुरोध प्राप्त किया है।',
                'expiry': 'यह लिंक 1 घंटे में समाप्त हो जाता है।',
            }
        }
        
        trans = translations.get(language, translations['en'])
        template_context.update(trans)
        
        return EmailService._send_email(
            user.email,
            trans['subject'],
            'emails/password_reset.html',
            template_context,
            'password_reset'
        )
    
    @staticmethod
    def send_weekly_report_email(user, report_data, language='en'):
        """
        Send weekly crop/yield summary email
        
        Args:
            user: User instance
            report_data: Dictionary containing report information
            language: User preferred language
        """
        
        template_context = {
            'user': user,
            'report': report_data,
            'language': language,
        }
        
        translations = {
            'en': {
                'subject': 'Your Weekly Farming Report',
                'intro': 'Here is your weekly summary for',
            },
            'kn': {
                'subject': 'ನಿಮ್ಮ ಸಾಪ್ತಾಹಿಕ ಕೃಷಿ ವರದಿ',
                'intro': 'ಇದು ನಿಮ್ಮ ಸಾಪ್ತಾಹಿಕ ಸಾರಾಂಶ',
            },
            'hi': {
                'subject': 'आपकी साप्ताहिक खेती रिपोर्ट',
                'intro': 'यह आपकी साप्ताहिक सारांश है',
            }
        }
        
        trans = translations.get(language, translations['en'])
        template_context.update(trans)
        
        return EmailService._send_email(
            user.email,
            trans['subject'],
            'emails/weekly_report.html',
            template_context,
            'weekly_report'
        )
    
    @staticmethod
    def send_recommendation_email(user, recommendations, language='en'):
        """
        Send 15-day farming recommendations email
        
        Args:
            user: User instance
            recommendations: List of recommendation objects
            language: User preferred language
        """
        
        template_context = {
            'user': user,
            'recommendations': recommendations,
            'language': language,
        }
        
        translations = {
            'en': {
                'subject': 'Your 15-Day Farming Recommendations',
                'intro': 'Personalized recommendations for the next 15 days:',
            },
            'kn': {
                'subject': 'ನಿಮ್ಮ 15-ದಿನದ ಕೃಷಿ ಶಿಫಾರಸುಗಳು',
                'intro': 'ಮುಂದಿನ 15 ದಿನಗಳಿಗೆ ವ್ಯಕ್ತಿಗತ ಶಿಫಾರಸುಗಳು:',
            },
            'hi': {
                'subject': 'आपकी 15-दिन की खेती सिफारिशें',
                'intro': 'अगले 15 दिनों के लिए व्यक्तिगत सिफारिशें:',
            }
        }
        
        trans = translations.get(language, translations['en'])
        template_context.update(trans)
        
        return EmailService._send_email(
            user.email,
            trans['subject'],
            'emails/recommendations.html',
            template_context,
            'recommendation'
        )
    
    @staticmethod
    def send_report_attachment_email(user, report_pdf_path, report_name, language='en'):
        """
        Send report as email attachment (when user clicks "Send Report")
        
        Args:
            user: User instance
            report_pdf_path: Path to the PDF file
            report_name: Name of the report
            language: User preferred language
        """
        
        template_context = {
            'user': user,
            'report_name': report_name,
            'language': language,
        }
        
        translations = {
            'en': {
                'subject': f'Your Farm Report: {report_name}',
                'intro': 'Please find your detailed farm report attached.',
            },
            'kn': {
                'subject': f'ನಿಮ್ಮ ಕೃಷಿ ವರದಿ: {report_name}',
                'intro': 'ನೀವು ನಿಮ್ಮ ವಿವರವಾದ ಕೃಷಿ ವರದಿಯನ್ನು ಲಗತ್ತುಗಾ ಕಾಣಬಹುದು.',
            },
            'hi': {
                'subject': f'आपकी खेती रिपोर्ट: {report_name}',
                'intro': 'कृपया अपनी विस्तृत खेती रिपोर्ट देखें।',
            }
        }
        
        trans = translations.get(language, translations['en'])
        template_context.update(trans)
        
        email_log = EmailService._send_email(
            user.email,
            trans['subject'],
            'emails/report_attachment.html',
            template_context,
            'report_export',
            attachment_path=report_pdf_path
        )
        
        return email_log
    
    @staticmethod
    def send_alert_notification_email(user, alert_data, language='en'):
        """
        Send alert notification email when nearby alert is reported
        
        Args:
            user: User instance
            alert_data: Dictionary containing alert information
            language: User preferred language
        """
        
        template_context = {
            'user': user,
            'alert': alert_data,
            'language': language,
        }
        
        translations = {
            'en': {
                'subject': f'Nearby {alert_data.get("type", "Farm")} Alert',
                'intro': 'There is an alert near your location:',
            },
            'kn': {
                'subject': f'ನಿಮ್ಮ ಸ್ಥಳದ ಸಮೀಪದಲ್ಲಿ ಎಚ್ಚರಿಕೆ',
                'intro': 'ನಿಮ್ಮ ಸ್ಥಳದ ಸಮೀಪದಲ್ಲಿ ಎಚ್ಚರಿಕೆ ಇದೆ:',
            },
            'hi': {
                'subject': f'आपके स्थान के पास अलर्ट',
                'intro': 'आपके स्थान के पास एक अलर्ट है:',
            }
        }
        
        trans = translations.get(language, translations['en'])
        template_context.update(trans)
        
        return EmailService._send_email(
            user.email,
            trans['subject'],
            'emails/alert_notification.html',
            template_context,
            'alert_notification'
        )
    
    @staticmethod
    def _send_email(to_email, subject, template_name, context, email_type, attachment_path=None):
        """
        Internal method to send email
        
        Args:
            to_email: Recipient email
            subject: Email subject
            template_name: Path to email template
            context: Template context
            email_type: Type of email for logging
            attachment_path: Optional path to file attachment
            
        Returns:
            EmailLog instance
        """
        
        try:
            # Try to render template, fallback to plain text if not found
            try:
                html_content = render_to_string(template_name, context)
                text_content = strip_tags(html_content)
            except:
                html_content = f"<p>{subject}</p>"
                text_content = subject
            
            msg = EmailMultiAlternatives(
                subject,
                text_content,
                settings.DEFAULT_FROM_EMAIL,
                [to_email]
            )
            
            msg.attach_alternative(html_content, "text/html")
            
            # Attach file if provided
            if attachment_path:
                import os
                if os.path.exists(attachment_path):
                    with open(attachment_path, 'rb') as attachment:
                        msg.attach(
                            os.path.basename(attachment_path),
                            attachment.read(),
                            'application/pdf'
                        )
            
            msg.send()
            
            # Log the email
            from apps.accounts.models import User
            try:
                user = User.objects.get(email=to_email)
                email_log = EmailLog.objects.create(
                    user=user,
                    email_to=to_email,
                    subject=subject,
                    email_type=email_type,
                    status='sent'
                )
            except User.DoesNotExist:
                email_log = None
            
            logger.info(f"Email sent successfully to {to_email}")
            return email_log
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            
            # Log the failure
            from apps.accounts.models import User
            try:
                user = User.objects.get(email=to_email)
                email_log = EmailLog.objects.create(
                    user=user,
                    email_to=to_email,
                    subject=subject,
                    email_type=email_type,
                    status='failed',
                    error_message=str(e)
                )
            except User.DoesNotExist:
                email_log = None
            
            return email_log
