# API Documentation - Directive 2023/970 Compliance System

## Overview

This document describes all REST API endpoints for the Directive 2023/970 Pay Transparency & Gender Equality Compliance System. The API is built with Next.js and provides role-based access control to all resources.

## Base URL

```
/api
```

## Authentication

All endpoints except `/auth/login` and `/auth/demo-accounts` require authentication via Bearer token.

### Request Header
```
Authorization: Bearer <token>
```

## Response Format

All responses follow a standard format:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "statusCode": 200
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

## Role-Based Access Control

- **EMPLOYEE**: Can view own data, request salary transparency
- **MANAGER**: Can manage team, approve justifications
- **HR_SPECIALIST**: Can manage jobs, import employees, create justifications
- **COMPLIANCE_OFFICER**: Can view reports, approve justifications, review transparency requests
- **ADMIN**: Full system access

---

## Authentication Endpoints

### POST /auth/login
Authenticate user and get access token.

**Body:**
```json
{
  "email": "user@company.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "base64_encoded_token",
    "user": {
      "id": "user-001",
      "email": "user@company.com",
      "name": "User Name",
      "role": "EMPLOYEE",
      "department": "Engineering"
    }
  },
  "statusCode": 200
}
```

**Error Codes:** 401 (Invalid credentials)

---

### POST /auth/logout
Logout current user and invalidate token.

**Headers:** Required authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  },
  "statusCode": 200
}
```

---

### GET /auth/verify
Verify current token validity.

**Headers:** Required authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-001",
    "email": "user@company.com",
    "role": "EMPLOYEE",
    "expiresAt": "2024-05-15T17:38:00Z"
  },
  "statusCode": 200
}
```

---

### GET /auth/demo-accounts
Get list of demo accounts for testing.

**Response:**
```json
{
  "success": true,
  "data": {
    "demoAccounts": [
      {
        "email": "employee@company.com",
        "password": "password123",
        "role": "EMPLOYEE",
        "name": "Ion Popescu",
        "description": "Employee - View personal salary, request transparency"
      },
      /* ... more demo accounts ... */
    ]
  },
  "statusCode": 200
}
```

---

## Analysis Endpoints

### GET /analysis/pay-gap
Get pay gap analysis data.

**Headers:** Required authentication (MANAGER, HR_SPECIALIST, COMPLIANCE_OFFICER, ADMIN)

**Query Parameters:**
- `jobGroup` (optional): Filter by specific job group

**Response (Summary):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalJobGroups": 3,
      "overallPayGap": 3.65,
      "totalEmployees": 75,
      "analysisDate": "2024-05-14T17:38:00Z"
    },
    "jobGroups": [
      {
        "jobGroup": "Developers",
        "totalEmployees": 42,
        "maleCount": 28,
        "femaleCount": 14,
        "averageMaleSalary": 5200,
        "averageFemaleSalary": 4950,
        "payGap": 4.81,
        "justifications": 3,
        "pendingJustifications": 1
      }
    ]
  },
  "statusCode": 200
}
```

---

## Job Evaluations Endpoints

### GET /jobs
Get all job evaluations.

**Headers:** Required authentication (HR_SPECIALIST, COMPLIANCE_OFFICER, ADMIN)

**Query Parameters:**
- `status` (optional): ACTIVE or INACTIVE

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 3,
    "jobs": [
      {
        "id": "job-001",
        "title": "Senior Developer",
        "jobGroup": "Developers",
        "level": "Senior",
        "pointValue": 450,
        "salaryMin": 4800,
        "salaryMax": 5800,
        "description": "Senior software engineer",
        "status": "ACTIVE",
        "createdAt": "2024-01-15T00:00:00Z",
        "updatedAt": "2024-05-14T00:00:00Z"
      }
    ]
  },
  "statusCode": 200
}
```

---

### POST /jobs
Create new job evaluation.

**Headers:** Required authentication (HR_SPECIALIST, COMPLIANCE_OFFICER, ADMIN)

**Body:**
```json
{
  "title": "Senior Developer",
  "jobGroup": "Developers",
  "level": "Senior",
  "pointValue": 450,
  "salaryMin": 4800,
  "salaryMax": 5800,
  "description": "Senior software engineer with 5+ years experience"
}
```

**Response:** 201 Created with job object

---

### GET /jobs/[id]
Get specific job evaluation.

**Headers:** Required authentication (HR_SPECIALIST, COMPLIANCE_OFFICER, ADMIN)

---

### PUT /jobs/[id]
Update job evaluation.

**Headers:** Required authentication (HR_SPECIALIST, COMPLIANCE_OFFICER, ADMIN)

---

### DELETE /jobs/[id]
Delete (soft delete) job evaluation.

**Headers:** Required authentication (HR_SPECIALIST, COMPLIANCE_OFFICER, ADMIN)

---

## Justifications Endpoints

### GET /justifications
Get all justifications.

**Headers:** Required authentication (HR_SPECIALIST, COMPLIANCE_OFFICER, ADMIN)

**Query Parameters:**
- `status` (optional): PENDING, APPROVED, REJECTED

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 3,
    "justifications": [
      {
        "id": "just-001",
        "jobGroup": "Developers",
        "payGap": 8.5,
        "justificationText": "Senior developers have higher salaries",
        "status": "APPROVED",
        "submittedAt": "2024-03-15T00:00:00Z",
        "approvedAt": "2024-03-20T00:00:00Z",
        "reviewComments": "Documentation satisfactory"
      }
    ]
  },
  "statusCode": 200
}
```

---

### POST /justifications
Submit new justification.

**Headers:** Required authentication (HR_SPECIALIST, COMPLIANCE_OFFICER, ADMIN)

**Body:**
```json
{
  "jobGroup": "Developers",
  "payGap": 8.5,
  "justificationText": "Explanation of pay gap",
  "documentUrl": "documents/justification.pdf"
}
```

---

### POST /justifications/[id]/approve
Approve or reject justification.

**Headers:** Required authentication (COMPLIANCE_OFFICER, ADMIN)

**Body:**
```json
{
  "action": "approve",
  "comments": "Documentation satisfactory"
}
```

**Actions:**
- `approve`: Mark as approved
- `reject`: Mark as rejected

---

## Transparency Endpoints

### GET /transparency/requests
Get transparency requests.

**Headers:** Required authentication

- EMPLOYEE: Can only view own requests
- HR_SPECIALIST, COMPLIANCE_OFFICER, ADMIN: Can view all requests

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 2,
    "requests": [
      {
        "id": "tr-001",
        "employeeId": "emp-001",
        "peerGroup": "Developers",
        "jobLevel": "Senior",
        "department": "Engineering",
        "status": "APPROVED",
        "requestedAt": "2024-05-10T00:00:00Z",
        "approvedAt": "2024-05-12T00:00:00Z",
        "averageSalary": 5150,
        "salaryRange": { "min": 4800, "max": 5800 },
        "peerCount": 28
      }
    ]
  },
  "statusCode": 200
}
```

---

### POST /transparency/requests
Create new transparency request.

**Headers:** Required authentication (EMPLOYEE)

**Body:**
```json
{
  "peerGroup": "Developers",
  "jobLevel": "Senior",
  "department": "Engineering"
}
```

---

### POST /transparency/[id]/review
Approve or deny transparency request.

**Headers:** Required authentication (HR_SPECIALIST, COMPLIANCE_OFFICER, ADMIN)

**Body:**
```json
{
  "action": "approve",
  "salary": 5150,
  "salaryRange": { "min": 4800, "max": 5800 },
  "peerCount": 28
}
```

**Actions:**
- `approve`: Grant access to salary information
- `deny`: Reject with denial reason

---

## Reports Endpoints

### GET /reports/compliance
Generate compliance report.

**Headers:** Required authentication (COMPLIANCE_OFFICER, ADMIN)

**Query Parameters:**
- `reportType` (required): overview, analysis, justifications, or trends

**Report Types:**

**overview:**
```json
{
  "generatedAt": "2024-05-14T17:38:00Z",
  "complianceStatus": "PARTIALLY_COMPLIANT",
  "overallPayGap": 3.65,
  "jobGroupsAnalyzed": 3,
  "justificationsSubmitted": 3,
  "justificationsApproved": 2,
  "criticalAreas": [/* ... */]
}
```

**analysis:** Detailed pay gap by job group

**justifications:** Status of all justifications

**trends:** Pay gap trend over time with forecast

---

### POST /reports/compliance
Export compliance report.

**Headers:** Required authentication (COMPLIANCE_OFFICER, ADMIN)

**Body:**
```json
{
  "reportType": "overview",
  "format": "pdf"
}
```

**Formats:** pdf, excel, csv

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Report export initiated",
    "downloadUrl": "/reports/export/overview-1234567890.pdf",
    "format": "pdf",
    "expiresIn": 3600
  },
  "statusCode": 200
}
```

---

## Admin Endpoints

### GET /admin/users
Get all users.

**Headers:** Required authentication (ADMIN)

**Query Parameters:**
- `role` (optional): EMPLOYEE, MANAGER, HR_SPECIALIST, COMPLIANCE_OFFICER, ADMIN
- `status` (optional): ACTIVE or INACTIVE

---

### POST /admin/users
Create new user.

**Headers:** Required authentication (ADMIN)

**Body:**
```json
{
  "email": "newuser@company.com",
  "name": "New User",
  "role": "EMPLOYEE",
  "department": "Engineering"
}
```

---

### GET /admin/audit-logs
Get audit logs.

**Headers:** Required authentication (COMPLIANCE_OFFICER, ADMIN)

**Query Parameters:**
- `action` (optional): Filter by action type
- `resource` (optional): Filter by resource
- `userId` (optional): Filter by user ID
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `limit` (optional): Max 500, default 50
- `offset` (optional): For pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 1250,
    "limit": 50,
    "offset": 0,
    "count": 50,
    "logs": [
      {
        "timestamp": "2024-05-14T17:38:00Z",
        "userId": "emp-001",
        "userEmail": "employee@company.com",
        "action": "LOGIN_SUCCESS",
        "resource": "AUTH",
        "resourceId": "login",
        "statusCode": 200,
        "ipAddress": "192.168.1.1"
      }
    ]
  },
  "statusCode": 200
}
```

---

### DELETE /admin/audit-logs
Purge audit logs older than 90 days.

**Headers:** Required authentication (ADMIN)

---

## Profile Endpoints

### GET /profile/me
Get current user profile.

**Headers:** Required authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "emp-001",
    "email": "employee@company.com",
    "name": "Ion Popescu",
    "role": "EMPLOYEE",
    "department": "Engineering"
  },
  "statusCode": 200
}
```

---

### PUT /profile/me
Update current user profile.

**Headers:** Required authentication

**Body:**
```json
{
  "name": "New Name",
  "department": "New Department"
}
```

---

## HTTP Status Codes

- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: User does not have permission to access resource
- **404 Not Found**: Resource not found
- **405 Method Not Allowed**: HTTP method not supported
- **500 Internal Server Error**: Server error

---

## Error Examples

### Unauthorized (401)
```json
{
  "success": false,
  "error": "Unauthorized: Missing token",
  "statusCode": 401
}
```

### Forbidden (403)
```json
{
  "success": false,
  "error": "Forbidden: Insufficient permissions",
  "statusCode": 403
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "Job not found",
  "statusCode": 404
}
```

---

## Audit Logging

All API actions are logged for compliance and security purposes:

**Tracked Events:**
- LOGIN_SUCCESS / LOGIN_FAILED
- LOGOUT
- CREATE_JOB
- UPDATE_JOB
- DELETE_JOB
- VIEW_PAY_GAP_SUMMARY / VIEW_PAY_GAP_DETAIL
- SUBMIT_JUSTIFICATION
- APPROVE_JUSTIFICATION / REJECT_JUSTIFICATION
- CREATE_TRANSPARENCY_REQUEST
- APPROVE_TRANSPARENCY_REQUEST / DENY_TRANSPARENCY_REQUEST
- GENERATE_REPORT / EXPORT_REPORT
- CREATE_USER
- VIEW_AUDIT_LOGS
- PURGE_AUDIT_LOGS

Each log includes:
- Timestamp (ISO 8601)
- User ID and email
- Action performed
- Resource and resource ID
- Changes made
- IP address
- HTTP status code

---

## Rate Limiting

Rate limiting is recommended for production:
- Authentication endpoints: 5 requests per minute per IP
- General endpoints: 100 requests per minute per user
- Report generation: 10 requests per hour per user

---

## GDPR Compliance

- All personal data is pseudonymized using SHA-256 hashing
- Data is encrypted in transit (HTTPS required in production)
- Audit logs are retained for 90 days maximum
- Users can request data deletion through the profile endpoint
- All sensitive operations are logged with full audit trails

---

## Version History

- **v1.0** (2024-05-14): Initial API release
  - Authentication endpoints
  - Job evaluations management
  - Pay gap analysis
  - Justifications workflow
  - Transparency requests
  - Compliance reports
  - Admin functions
  - Audit logging
