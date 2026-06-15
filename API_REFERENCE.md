# Smart Agriculture System - API Quick Reference

## Base URL
```
http://127.0.0.1:8000/api
```

## Authentication
All protected endpoints require `Authorization: Bearer {access_token}` header.

---

## 🔐 AUTHENTICATION ENDPOINTS

### 1. Register User
```http
POST /auth/register/
Content-Type: application/json

{
  "username": "farmer_john",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirm_password": "SecurePass123!",
  "phone_number": "+919876543210",
  "preferred_language": "kn"
}

Response (201 Created):
{
  "message": "User registered successfully. Please check your email to verify.",
  "user": {
    "id": 1,
    "username": "farmer_john",
    "email": "john@example.com",
    "phone_number": "+919876543210",
    "is_email_verified": false,
    "preferred_language": "kn",
    "created_at": "2026-05-28T10:30:00Z"
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

### 2. Login User
```http
POST /auth/login/
Content-Type: application/json

{
  "username": "farmer_john",
  "password": "SecurePass123!"
}

Response (200 OK):
{
  "message": "Login successful",
  "user": { ... },
  "tokens": { ... }
}

Error (403 Forbidden - Email not verified):
{
  "error": "Please verify your email before logging in",
  "email_verified": false
}
```

### 3. Verify Email
```http
POST /auth/verify-email/
Content-Type: application/json

{
  "token": "550e8400-e29b-41d4-a716-446655440000"
}

Response (200 OK):
{
  "message": "Email verified successfully",
  "user": { ... }
}
```

### 4. Resend Verification Email
```http
POST /auth/resend-verification/
Content-Type: application/json

{
  "email": "john@example.com"
}

Response (200 OK):
{
  "message": "Verification email sent successfully"
}
```

### 5. Request Password Reset
```http
POST /auth/password-reset/
Content-Type: application/json

{
  "email": "john@example.com"
}

Response (200 OK):
{
  "message": "Password reset link has been sent to your email"
}
```

### 6. Confirm Password Reset
```http
POST /auth/password-reset-confirm/
Content-Type: application/json

{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "password": "NewPassword123!",
  "confirm_password": "NewPassword123!"
}

Response (200 OK):
{
  "message": "Password reset successfully"
}
```

### 7. Change Password (Authenticated)
```http
POST /auth/change-password/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "old_password": "SecurePass123!",
  "new_password": "NewPassword123!",
  "confirm_password": "NewPassword123!"
}

Response (200 OK):
{
  "message": "Password changed successfully"
}
```

### 8. Get User Profile
```http
GET /auth/profile/
Authorization: Bearer {access_token}

Response (200 OK):
{
  "id": 1,
  "username": "farmer_john",
  "email": "john@example.com",
  "phone_number": "+919876543210",
  "is_email_verified": true,
  "preferred_language": "kn",
  "created_at": "2026-05-28T10:30:00Z"
}
```

### 9. Update User Profile
```http
PUT /auth/profile/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "phone_number": "+919876543211",
  "preferred_language": "hi"
}

Response (200 OK):
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

### 10. Refresh Access Token
```http
POST /auth/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}

Response (200 OK):
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 11. Logout
```http
POST /auth/logout/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}

Response (200 OK):
{
  "message": "Logout successful"
}
```

---

## 🚨 ALERT ENDPOINTS

### 1. Report Alert
```http
POST /alerts/report/
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

Form Data:
- alert_type: "PEST" | "ANIMAL" | "DISEASE" | "WEATHER"
- severity: "DANGER" | "WARNING" | "SAFE"
- description: "Locust swarm spotted in north field"
- latitude: 12.9716
- longitude: 77.5946
- image: (optional file upload)

Response (201 Created):
{
  "message": "Alert reported successfully",
  "alert": {
    "id": 1,
    "alert_type": "PEST",
    "severity": "DANGER",
    "description": "Locust swarm spotted in north field",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "image": "http://example.com/media/alerts/image.jpg",
    "created_at": "2026-05-28T10:30:00Z",
    "expires_at": "2026-06-04T10:30:00Z",
    "is_active": true
  }
}
```

### 2. Get Nearby Alerts
```http
GET /alerts/nearby/?latitude=12.9716&longitude=77.5946&type=PEST&severity=DANGER&radius=10
Authorization: Bearer {access_token}

Query Parameters:
- latitude: required
- longitude: required
- type: optional (PEST, ANIMAL, DISEASE, WEATHER)
- severity: optional (DANGER, WARNING, SAFE)
- radius: optional (default 10 km)

Response (200 OK):
{
  "radius_km": 10,
  "count": 3,
  "alerts": [
    {
      "id": 1,
      "alert_type": "PEST",
      "severity": "DANGER",
      "description": "Locust swarm spotted",
      "latitude": 12.9816,
      "longitude": 77.6046,
      "created_at": "2026-05-28T10:30:00Z",
      "expires_at": "2026-06-04T10:30:00Z",
      "is_active": true,
      "is_read": false,
      "is_dismissed": false
    }
  ]
}
```

### 3. Get User's Alerts
```http
GET /alerts/my-alerts/
Authorization: Bearer {access_token}

Response (200 OK):
{
  "count": 5,
  "alerts": [ ... ]
}
```

### 4. Get Alert Details
```http
GET /alerts/{alert_id}/
Authorization: Bearer {access_token}

Response (200 OK):
{
  "id": 1,
  "alert_type": "PEST",
  "severity": "DANGER",
  "description": "Locust swarm spotted",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "image": "http://example.com/media/alerts/image.jpg",
  "created_at": "2026-05-28T10:30:00Z",
  "expires_at": "2026-06-04T10:30:00Z",
  "is_active": true,
  "is_read": true,
  "is_dismissed": false,
  "user": {
    "id": 1,
    "username": "reporter_user"
  }
}
```

### 5. Delete Alert
```http
DELETE /alerts/{alert_id}/
Authorization: Bearer {access_token}

Response (200 OK):
{
  "message": "Alert deleted successfully"
}

Error (404 Not Found):
{
  "error": "Alert not found or you don't have permission to delete it"
}
```

### 6. Dismiss Alert
```http
POST /alerts/{alert_id}/dismiss/
Authorization: Bearer {access_token}

Response (200 OK):
{
  "message": "Alert dismissed successfully"
}
```

### 7. Get Alert Analytics
```http
GET /alerts/analytics/
Authorization: Bearer {access_token}

Response (200 OK):
{
  "total": 25,
  "danger": 5,
  "warning": 8,
  "safe": 12,
  "user_unread_count": 3,
  "breakdown": {
    "pest": 8,
    "animal": 5,
    "disease": 7,
    "weather": 5
  }
}
```

---

## 📊 REPORTS ENDPOINTS

### Send Report via Email
```http
POST /reports/{report_id}/send-email/
Authorization: Bearer {access_token}

Response (200 OK):
{
  "message": "Report sent to your email successfully",
  "email_log": {
    "id": 1,
    "email_to": "john@example.com",
    "subject": "Your Farm Report",
    "email_type": "report_export",
    "status": "sent",
    "sent_at": "2026-05-28T10:30:00Z"
  }
}
```

---

## 📧 NOTIFICATION DELIVERY

### Automatic Email Notifications

**1. Email Verification (On Registration)**
- Sent immediately after registration
- Contains verification link
- Expires in 24 hours
- User cannot login until verified

**2. Password Reset**
- Sent when user requests password reset
- Contains reset link
- Expires in 1 hour
- Can only be used once

**3. Weekly Report** (Monday 8 AM)
- Automatic weekly email
- Contains yield predictions and weather
- Only sent to verified users

**4. Daily Recommendations** (Daily 9 AM)
- Personalized farming recommendations
- 15-day forecast
- Only sent to verified users

**5. Alert Notifications** (Real-time)
- Sent when nearby alert is reported
- Only to users within 10km radius
- Can be dismissed by recipient

---

## 🔄 CELERY TASKS

### Manual Task Triggering (Admin/Development)

```python
from tasks import (
    send_email_verification_task,
    send_weekly_reports_task,
    send_daily_recommendations_task,
    cleanup_expired_alerts_task
)

# Send verification email
send_email_verification_task.delay(user_id=1, verification_link="...")

# Send weekly reports to all users
send_weekly_reports_task.delay()

# Send daily recommendations
send_daily_recommendations_task.delay()

# Cleanup expired alerts
cleanup_expired_alerts_task.delay()
```

### Monitor Celery Tasks

```bash
# Install Flower (task monitoring)
pip install flower

# Run Flower dashboard
celery -A config events
celery -A config flower

# Access at http://localhost:5555
```

---

## ⚠️ ERROR RESPONSES

### Common Error Codes

| Status | Error | Meaning |
|--------|-------|---------|
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Email not verified / Permission denied |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |

### Example Error Response
```json
{
  "error": "Invalid credentials",
  "details": {
    "email": ["This field is required"],
    "password": ["This field must be at least 8 characters"]
  }
}
```

---

## 🎯 RATE LIMITING

**Limits:**
- Anonymous users: 100 requests/hour
- Authenticated users: 1000 requests/hour

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1622198400
```

---

## 🔒 SECURITY NOTES

1. **Always use HTTPS** in production
2. **Never share refresh tokens** in logs or error messages
3. **Validate all user inputs** on frontend and backend
4. **Use strong passwords** (min 8 chars, mixed case, numbers, symbols)
5. **Store tokens securely** (httpOnly cookies or secure storage)
6. **Implement CSRF protection** for form submissions
7. **Rate limit login attempts** to prevent brute force
8. **Log security events** for audit trails

---

Generated: May 28, 2026  
Version: 1.0
