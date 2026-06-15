# Smart Agriculture System - Advanced Features Implementation Guide

## Overview
This document provides a complete guide to the advanced features and improvements added to the Smart Agriculture System. All changes maintain backward compatibility with existing features.

---

## ✅ COMPLETED BACKEND CHANGES

### 1. Enhanced Django Settings (`config/settings.py`)

**Changes Made:**
- Added email configuration (SMTP for Gmail, SendGrid, etc.)
- Configured Celery with Redis for background tasks
- Added Celery Beat schedule for periodic tasks
- Added rate limiting (100 req/hr for anonymous, 1000 for authenticated)
- Added comprehensive logging configuration

**Required Environment Variables:**
```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password  # Use Gmail App Password!
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=noreply@smartfarm.com
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### 2. Celery Configuration (`config/celery.py` & `config/wsgi.py`)

**Changes Made:**
- Created Celery app configuration
- Auto-discovery of tasks from Django apps
- Updated WSGI to initialize Celery

**To Run Celery Worker (Development):**
```bash
cd backend
celery -A config worker -l info
```

**To Run Celery Beat (Scheduler):**
```bash
cd backend
celery -A config beat -l info
```

### 3. Enhanced User Model (`apps/accounts/models.py`)

**New Fields Added:**
```python
- is_email_verified: Boolean (default=False)
- email_verified_at: DateTime
- preferred_language: Choice field ('en', 'kn', 'hi')
- oauth_provider: CharField (google, facebook)
- oauth_id: CharField (for OAuth provider ID)
```

**New Models Created:**
```python
- EmailVerificationToken: Stores email verification tokens with expiry
- PasswordResetToken: Stores password reset tokens with expiry and used status
```

### 4. Enhanced Alert System (`apps/alerts/models.py`)

**New Fields Added to CommunityAlert:**
```python
- expires_at: DateTime (auto-set to 7 days from creation)
- read_by_users: ManyToMany (tracks who read the alert)
- dismissed_by_users: ManyToMany (tracks who dismissed the alert)
```

**New Models Created:**
```python
- AlertNotification: Tracks notifications sent to users about alerts
```

### 5. Email & Reporting Models (`apps/reports/models.py`)

**New Models Created:**
```python
- EmailLog: Tracks all emails sent (type, status, error)
- ReportHistory: Tracks report actions (generated, viewed, downloaded, emailed)
```

### 6. Email Service (`services/email_service.py`)

**Features:**
- Multi-language email support (English, Kannada, Hindi)
- HTML email templates
- Supports multiple email types:
  - Email verification
  - Password reset
  - Weekly reports
  - Daily recommendations
  - Alert notifications
  - Report attachments

**Usage Example:**
```python
from services.email_service import EmailService

EmailService.send_verification_email(user, verification_link, 'en')
EmailService.send_weekly_report_email(user, report_data, user.preferred_language)
```

### 7. Notification Service (`services/notification_service.py`)

**Features:**
- Geolocation-based alert filtering (10km radius using Haversine formula)
- Track read/unread alerts per user
- Dismiss alerts for users
- Find nearby users for alert notifications

**Key Methods:**
```python
- calculate_distance(lat1, lon1, lat2, lon2): Calculate distance between coordinates
- get_nearby_users(latitude, longitude): Get users within radius
- notify_nearby_users_about_alert(alert): Send notifications to nearby users
- mark_alert_as_read_by_user(alert, user): Mark alert as read
- dismiss_alert_for_user(alert, user): Dismiss alert for user
- get_unread_alerts_for_user(user): Get unread, non-dismissed alerts
```

### 8. Celery Background Tasks (`tasks.py`)

**Email Tasks:**
```python
- send_email_verification_task(user_id, verification_link)
- send_password_reset_task(user_id, reset_link)
- send_alert_notification_task(user_id, alert_id)
```

**Report Tasks:**
```python
- send_weekly_reports_task() # Runs Monday 8 AM
- send_daily_recommendations_task() # Runs daily 9 AM
- generate_and_send_report_pdf_task(user_id, report_id)
```

**Alert Maintenance Tasks:**
```python
- cleanup_expired_alerts_task() # Runs daily midnight
- deactivate_dismissed_alerts_task() # Optional
- cleanup_expired_tokens_task() # Runs daily
```

### 9. Email Templates (`templates/emails/`)

**Created Templates:**
```
- verification.html: Email verification template
- password_reset.html: Password reset template
- weekly_report.html: Weekly crop/yield summary
- recommendations.html: 15-day farming recommendations
- alert_notification.html: Alert notification to nearby users
- report_attachment.html: Report sent via email
```

All templates are:
- Responsive HTML emails
- Professionally styled
- Support multi-language content
- Include proper branding

### 10. Enhanced Authentication Views (`apps/accounts/views.py`)

**New Endpoints:**
```
POST /api/auth/register/              # Register with email verification
POST /api/auth/login/                 # Login (checks email verification)
POST /api/auth/verify-email/          # Verify email with token
POST /api/auth/resend-verification/   # Resend verification email
POST /api/auth/password-reset/        # Request password reset
POST /api/auth/password-reset-confirm/# Reset password with token
POST /api/auth/change-password/       # Change password (authenticated)
GET  /api/auth/profile/               # Get user profile
PUT  /api/auth/profile/               # Update user profile (language preference)
POST /api/auth/logout/                # Logout
```

**Request/Response Examples:**

Register:
```json
POST /api/auth/register/
{
  "username": "john_farmer",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirm_password": "SecurePass123!",
  "phone_number": "+919876543210",
  "preferred_language": "kn"
}

Response:
{
  "message": "User registered successfully. Please check your email to verify.",
  "user": {
    "id": 1,
    "username": "john_farmer",
    "email": "john@example.com",
    "is_email_verified": false,
    "preferred_language": "kn"
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

Verify Email:
```json
POST /api/auth/verify-email/
{
  "token": "uuid-token-from-email"
}

Response:
{
  "message": "Email verified successfully",
  "user": { ... }
}
```

Password Reset Request:
```json
POST /api/auth/password-reset/
{
  "email": "john@example.com"
}

Response:
{
  "message": "Password reset link has been sent to your email"
}
```

### 11. Enhanced Alert Views (`apps/alerts/views.py`)

**New Endpoints:**
```
POST /api/alerts/report/              # Report alert
GET  /api/alerts/nearby/              # Get nearby alerts (10km radius)
GET  /api/alerts/my-alerts/           # Get user's own alerts
GET  /api/alerts/<id>/                # Get alert detail (marks as read)
DELETE /api/alerts/<id>/              # Delete alert (owner only)
POST /api/alerts/<id>/dismiss/        # Dismiss alert for user
GET  /api/alerts/analytics/           # Get alert statistics
```

**Get Nearby Alerts:**
```json
GET /api/alerts/nearby/?latitude=12.9716&longitude=77.5946&type=PEST&severity=DANGER&radius=10

Response:
{
  "radius_km": 10,
  "count": 3,
  "alerts": [
    {
      "id": 1,
      "alert_type": "PEST",
      "severity": "DANGER",
      "description": "Locust swarm sighted in fields",
      "latitude": 12.9816,
      "longitude": 77.6046,
      "created_at": "2026-05-28T10:30:00Z",
      "expires_at": "2026-06-04T10:30:00Z",
      "is_expired": false
    }
  ]
}
```

---

## ⚠️ DATABASE MIGRATIONS REQUIRED

**Before running the application, execute these migrations:**

```bash
cd backend

# Create migrations for new models
python manage.py makemigrations accounts
python manage.py makemigrations alerts
python manage.py makemigrations reports

# Apply migrations
python manage.py migrate

# Create logs directory (if not exists)
mkdir -p logs
```

**Migration Files Created:**
- `apps/accounts/migrations/000X_add_email_verification_fields.py`
- `apps/accounts/migrations/000X_add_oauth_fields.py`
- `apps/alerts/migrations/000X_add_alert_expiry_and_tracking.py`
- `apps/reports/migrations/000X_add_email_log_and_history.py`

---

## 📦 NEW DEPENDENCIES

**Install required packages:**

```bash
pip install -r requirements.txt
```

**Key New Packages:**
```
celery==5.4.0
redis==5.3.1
django-celery-beat==2.5.0
google-auth-oauthlib==1.2.0
social-auth-app-django==5.4.1
email-validator==2.2.0
pydantic==2.9.0
```

**Additional Setup Required:**

1. **Redis Installation:**
   ```bash
   # Windows (using WSL or Docker)
   docker run -d -p 6379:6379 redis:latest
   
   # OR macOS
   brew install redis
   redis-server
   
   # OR Linux
   sudo apt-get install redis-server
   redis-server
   ```

2. **Verify Redis is Running:**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

---

## 🔧 SETUP INSTRUCTIONS

### Local Development Setup

```bash
# 1. Update Python environment
cd backend
pip install --upgrade pip
pip install -r requirements.txt

# 2. Create/update environment variables
cp .env.example .env
# Edit .env with your actual values

# 3. Create logs directory
mkdir -p logs

# 4. Run migrations
python manage.py makemigrations
python manage.py migrate

# 5. Create superuser (if needed)
python manage.py createsuperuser

# 6. Run development server
python manage.py runserver

# 7. In another terminal, run Celery worker
celery -A config worker -l info

# 8. In another terminal, run Celery beat (scheduler)
celery -A config beat -l info
```

### Docker Setup (Recommended for Production)

```dockerfile
# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

---

## 🚀 FRONTEND CHANGES NEEDED (PARTIALLY COMPLETE)

### 1. Authentication Frontend Updates

**Create new pages:**
- `src/pages/RegisterPage.tsx` - Enhanced register with language selection
- `src/pages/VerifyEmailPage.tsx` - Email verification page
- `src/pages/ForgotPasswordPage.tsx` - Forgot password form
- `src/pages/ResetPasswordPage.tsx` - Reset password with token
- `src/pages/ChangePasswordPage.tsx` - Change password (authenticated)

**Update existing pages:**
- `src/pages/LoginPage.tsx` - Add email verification check
- `src/context/AuthContext.tsx` - Add language preference to user state

### 2. Translation System (i18next)

**Install packages:**
```bash
cd frontend
npm install i18next i18next-browser-languagedetector i18next-http-backend react-i18next
```

**Create translation structure:**
```
frontend/src/locales/
├── en/
│   ├── auth.json
│   ├── alerts.json
│   ├── reports.json
│   └── common.json
├── kn/
│   ├── auth.json
│   ├── alerts.json
│   ├── reports.json
│   └── common.json
└── hi/
    ├── auth.json
    ├── alerts.json
    ├── reports.json
    └── common.json
```

**Sample translation file (en/auth.json):**
```json
{
  "register": "Register",
  "login": "Login",
  "email": "Email Address",
  "password": "Password",
  "confirmPassword": "Confirm Password",
  "forgotPassword": "Forgot Password?",
  "emailVerificationRequired": "Please verify your email before logging in",
  "checkEmail": "Check your email for verification link",
  "resetPassword": "Reset Password",
  "newPassword": "New Password",
  "changePassword": "Change Password"
}
```

### 3. Alert Improvements Frontend

**Update existing alert components:**
- Add dismiss button to alert cards
- Show alert expiry time
- Show read/unread status
- Add delete option for user's own alerts

**New functionality:**
- Mark alerts as read when clicked
- Toast notification for dismiss action
- Show alert age/creation time
- Improved alert filtering UI

### 4. UI/UX Improvements

**Loading States:**
- Add skeleton loaders for data-heavy components
- Show loading animations for async operations

**Toast Notifications:**
```bash
npm install react-toastify
```

**Error Handling:**
- Better error messages displayed to users
- Retry mechanism for failed operations

**Empty States:**
- Show helpful messages when no data available
- Add suggestions for next steps

### 5. Email Report Functionality

**New UI Components:**
- "Send Report" button in reports section
- Report preview before sending
- Email delivery confirmation

**Integration:**
```typescript
// Example API call
async function sendReport(reportId: number) {
  const response = await api.post(`/reports/${reportId}/send-email/`);
  return response.data;
}
```

---

## 📊 TASK SCHEDULER SCHEDULES

**Weekly Reports** - Monday 8:00 AM UTC
```
Sends comprehensive yield predictions and weather analysis
```

**Daily Recommendations** - Every day 9:00 AM UTC
```
Sends personalized 15-day farming recommendations
```

**Alert Cleanup** - Every day 00:00 AM UTC
```
Automatically deactivates alerts older than 7 days
```

**Token Cleanup** - Every day 01:00 AM UTC
```
Deletes expired verification and password reset tokens
```

---

## 🔐 SECURITY FEATURES IMPLEMENTED

### Email Verification
- Random UUID tokens
- 24-hour expiration
- Token deletion after use
- Prevents login without verification

### Password Reset
- Secure token generation
- 1-hour expiration
- One-time use only
- Old tokens marked as used

### Rate Limiting
- 100 requests/hour for anonymous users
- 1000 requests/hour for authenticated users
- Prevents brute force attacks

### Input Validation
- Email format validation
- Password strength validation
- Required field validation
- Sanitization of user inputs

---

## 📝 API DOCUMENTATION

### Authentication Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/register/` | No | Register new user |
| POST | `/api/auth/login/` | No | Login user |
| POST | `/api/auth/verify-email/` | No | Verify email with token |
| POST | `/api/auth/resend-verification/` | No | Resend verification email |
| POST | `/api/auth/password-reset/` | No | Request password reset |
| POST | `/api/auth/password-reset-confirm/` | No | Confirm password reset |
| POST | `/api/auth/change-password/` | Yes | Change password |
| GET | `/api/auth/profile/` | Yes | Get user profile |
| PUT | `/api/auth/profile/` | Yes | Update user profile |
| POST | `/api/auth/logout/` | Yes | Logout user |
| POST | `/api/auth/refresh/` | No | Refresh access token |

### Alert Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/alerts/report/` | Yes | Report new alert |
| GET | `/api/alerts/nearby/` | Yes | Get nearby alerts |
| GET | `/api/alerts/my-alerts/` | Yes | Get user's alerts |
| GET | `/api/alerts/<id>/` | Yes | Get alert details |
| DELETE | `/api/alerts/<id>/` | Yes | Delete alert |
| POST | `/api/alerts/<id>/dismiss/` | Yes | Dismiss alert |
| GET | `/api/alerts/analytics/` | Yes | Get statistics |

---

## 🧪 TESTING

### Test Email Sending (Development)

```bash
# Use console email backend for testing
# In settings.py, set:
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
# Emails will be printed to console
```

### Test Celery Tasks

```python
# In Django shell
python manage.py shell

from apps.accounts.models import User
from tasks import send_email_verification_task

user = User.objects.first()
send_email_verification_task.delay(user.id, 'http://localhost:3000/verify')
```

### Test Alert Geolocation

```bash
# Test nearby alerts endpoint
curl "http://127.0.0.1:8000/api/alerts/nearby/?latitude=12.9716&longitude=77.5946"
```

---

## 🐛 TROUBLESHOOTING

### Issue: Emails not sending

**Solution:**
1. Check `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` in `.env`
2. If using Gmail: 
   - Enable 2-factor authentication
   - Generate App Password at: myaccount.google.com/apppasswords
3. Check firewall/antivirus blocking SMTP port 587
4. View email logs: `EmailLog.objects.all()`

### Issue: Celery tasks not running

**Solution:**
1. Ensure Redis is running: `redis-cli ping`
2. Check Celery worker is running in separate terminal
3. Check Celery logs for errors
4. Verify `CELERY_BROKER_URL` in `.env`

### Issue: Migrations failing

**Solution:**
```bash
# Reset migrations (DEV ONLY - loses data!)
rm apps/accounts/migrations/000*
python manage.py makemigrations
python manage.py migrate

# Check migration status
python manage.py showmigrations
```

---

## 📋 CHECKLIST FOR PRODUCTION

- [ ] Update `SECRET_KEY` in settings
- [ ] Set `DEBUG = False`
- [ ] Configure proper database (PostgreSQL)
- [ ] Set up real email provider (SendGrid, AWS SES, etc.)
- [ ] Configure Redis for production
- [ ] Set up Celery worker monitoring (Flower)
- [ ] Enable HTTPS (SSL certificates)
- [ ] Configure CORS properly
- [ ] Set up logging to file/external service
- [ ] Configure backups
- [ ] Set up monitoring and alerts
- [ ] Configure rate limiting for production
- [ ] Test email delivery
- [ ] Test background task execution
- [ ] Set up error tracking (Sentry)

---

## 📞 SUPPORT & REFERENCES

### Official Documentation
- [Django](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Celery](https://docs.celeryproject.io/)
- [Redis](https://redis.io/documentation)

### Third-party Services
- [Gmail App Passwords](https://myaccount.google.com/apppasswords)
- [SendGrid Documentation](https://sendgrid.com/docs)
- [AWS SES](https://docs.aws.amazon.com/ses/)

---

## Version Information

**Created:** May 28, 2026  
**Python Version:** 3.11+  
**Django Version:** 6.0.5  
**DRF Version:** 3.17.1  
**Celery Version:** 5.4.0  
**Redis Version:** Latest  

---

**Document End**
