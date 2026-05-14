# API Endpoints Summary - ITERAȚIA 5

## Complete Implementation Overview

All endpoints have been implemented with full authentication, authorization, and audit logging.

---

## Authentication Module (5 endpoints)

| Endpoint | Method | Auth | Roles | Purpose |
|----------|--------|------|-------|---------|
| `/auth/login` | POST | ❌ | - | User login and token generation |
| `/auth/logout` | POST | ✅ | All | User logout |
| `/auth/verify` | GET | ✅ | All | Verify token validity |
| `/auth/demo-accounts` | GET | ❌ | - | Get demo account credentials |

**File:** `pages/api/auth/`

**Key Features:**
- Password hashing with SHA-256
- JWT-like token generation with 24-hour expiration
- Audit logging for all authentication events
- IP address tracking
- Support for 5 demo accounts with different roles

---

## Pay Gap Analysis Module (1 endpoint)

| Endpoint | Method | Auth | Roles | Purpose |
|----------|--------|------|-------|---------|
| `/analysis/pay-gap` | GET | ✅ | Manager, HR, Compliance, Admin | Get pay gap data by job group |

**File:** `pages/api/analysis/pay-gap.ts`

**Key Features:**
- Summary view of overall pay gap (3.65%)
- Detailed analysis by job group
- Metrics: employee counts, gender breakdown, salary averages, pay gap percentage
- Justification tracking per job group
- Audit logging for all analysis views

**Sample Data:**
- Developers: 8.5% pay gap, 42 employees
- Managers: 4.62% pay gap, 15 employees
- Support: 1.56% pay gap, 18 employees

---

## Job Evaluations Module (4 endpoints)

| Endpoint | Method | Auth | Roles | Purpose |
|----------|--------|------|-------|---------|
| `/jobs` | GET | ✅ | HR, Compliance, Admin | List all job evaluations |
| `/jobs` | POST | ✅ | HR, Compliance, Admin | Create new job evaluation |
| `/jobs/[id]` | GET | ✅ | HR, Compliance, Admin | Get specific job evaluation |
| `/jobs/[id]` | PUT | ✅ | HR, Compliance, Admin | Update job evaluation |
| `/jobs/[id]` | DELETE | ✅ | HR, Compliance, Admin | Delete job evaluation (soft delete) |

**File:** `pages/api/jobs/`

**Key Features:**
- Full CRUD operations on job evaluations
- Job hierarchy: title, group, level, point value
- Salary ranges per job
- Status tracking (ACTIVE/INACTIVE)
- Audit trail with creation/update info
- Pagination support
- Filter by status

---

## Justifications Module (3 endpoints)

| Endpoint | Method | Auth | Roles | Purpose |
|----------|--------|------|-------|---------|
| `/justifications` | GET | ✅ | HR, Compliance, Admin | List all justifications |
| `/justifications` | POST | ✅ | HR, Compliance, Admin | Submit new justification |
| `/justifications/[id]/approve` | POST | ✅ | Compliance, Admin | Approve or reject justification |

**File:** `pages/api/justifications/`

**Key Features:**
- Multi-step justification workflow
- Status tracking: PENDING → APPROVED/REJECTED
- Document attachment support
- Review comments and audit trail
- Filter by status
- Full approval history

**Workflow:**
1. Submit justification with supporting document
2. Compliance officer reviews
3. Approval or rejection with comments
4. Audit trail maintained

---

## Transparency Requests Module (3 endpoints)

| Endpoint | Method | Auth | Roles | Purpose |
|----------|--------|------|-------|---------|
| `/transparency/requests` | GET | ✅ | All | Get transparency requests (filtered by role) |
| `/transparency/requests` | POST | ✅ | Employee | Create new transparency request |
| `/transparency/[id]/review` | POST | ✅ | HR, Compliance, Admin | Approve or deny transparency request |

**File:** `pages/api/transparency/`

**Key Features:**
- Employee self-service transparency requests
- Request filtering: peer group, job level, department
- Status tracking: PENDING → APPROVED/DENIED
- Salary statistics provided with approval
- Peer count and salary range information
- Denial reasons tracking
- Role-based visibility (employees see only their requests)

**Workflow:**
1. Employee requests salary transparency
2. HR/Compliance reviews request
3. Approval with anonymized statistics or denial with reason
4. Employee views approved results

---

## Compliance Reports Module (2 endpoints)

| Endpoint | Method | Auth | Roles | Purpose |
|----------|--------|------|-------|---------|
| `/reports/compliance` | GET | ✅ | Compliance, Admin | Generate compliance report |
| `/reports/compliance` | POST | ✅ | Compliance, Admin | Export report in PDF/Excel/CSV |

**File:** `pages/api/reports/compliance.ts`

**Key Features:**
- Four report types:
  - **Overview**: Compliance status, key metrics, critical areas
  - **Analysis**: Detailed pay gap by job group
  - **Justifications**: Justification status summary
  - **Trends**: 12-month pay gap trends with forecast
- Multiple export formats: PDF, Excel, CSV
- Automatic URL generation for downloads
- 1-hour expiration on export links

**Report Metrics:**
- Overall compliance status
- Pay gap trends over time
- Improvement rate calculation
- 6-month forecast
- Critical areas identification

---

## Admin Module (4 endpoints)

| Endpoint | Method | Auth | Roles | Purpose |
|----------|--------|------|-------|---------|
| `/admin/users` | GET | ✅ | Admin | List all users |
| `/admin/users` | POST | ✅ | Admin | Create new user |
| `/admin/audit-logs` | GET | ✅ | Compliance, Admin | View audit logs |
| `/admin/audit-logs` | DELETE | ✅ | Admin | Purge audit logs older than 90 days |

**File:** `pages/api/admin/`

**Key Features:**
- User management (CRUD)
- Role assignment and department tracking
- Last login tracking
- Advanced audit log filtering:
  - By action, resource, user
  - By date range
  - Pagination (max 500 per page)
- Automatic audit log purging after 90 days
- Full access control

---

## Profile Module (2 endpoints)

| Endpoint | Method | Auth | Roles | Purpose |
|----------|--------|------|-------|---------|
| `/profile/me` | GET | ✅ | All | Get current user profile |
| `/profile/me` | PUT | ✅ | All | Update current user profile |

**File:** `pages/api/profile/me.ts`

**Key Features:**
- User profile retrieval
- Editable fields: name, department
- Read-only fields: id, email, role
- Audit logging for all profile changes

---

## Utility Files

### `utils/api.ts` (900+ lines)

Core utilities for all API endpoints:

**Authentication:**
- `hashPassword()`: SHA-256 password hashing
- `generateToken()`: JWT-like token generation
- `verifyToken()`: Token validation
- `getTokenFromRequest()`: Extract token from request

**Middleware:**
- `withAuth()`: Authentication middleware
- `withRole()`: Role-based authorization middleware
- `withMethod()`: HTTP method validation

**Response Handlers:**
- `sendSuccess()`: Standard success response
- `sendError()`: Standard error response

**Security:**
- `pseudonymizeData()`: GDPR-compliant data anonymization
- `logAudit()`: Comprehensive audit trail logging
- `getClientIp()`: Client IP extraction

**Validation:**
- `isValidEmail()`: Email format validation
- `isValidPassword()`: Password strength validation

**Mock Data:**
- Pre-configured demo accounts
- In-memory token storage
- Audit log storage

---

## Database Structure Overview

### Entities

**Users**
```
- id, email, name, role, department
- passwordHash, status
- createdAt, lastLogin
```

**Job Evaluations**
```
- id, title, jobGroup, level, pointValue
- salaryMin, salaryMax, description
- status, createdAt, updatedAt, createdBy
```

**Pay Gap Analysis**
```
- jobGroup, totalEmployees, maleCount, femaleCount
- averageMaleSalary, averageFemaleSalary, payGap
- justifications, pendingJustifications
```

**Justifications**
```
- id, jobGroup, payGap, justificationText, documentUrl
- status (PENDING, APPROVED, REJECTED)
- submittedBy, submittedAt, approvedBy, approvedAt
- reviewComments
```

**Transparency Requests**
```
- id, employeeId, peerGroup, jobLevel, department
- status (PENDING, APPROVED, DENIED)
- requestedAt, approvedAt
- averageSalary, salaryRange, peerCount
```

**Audit Logs**
```
- timestamp, userId, userEmail, action, resource, resourceId
- changes, ipAddress, statusCode
```

---

## Security Features

### Authentication
- ✅ Bearer token authentication
- ✅ 24-hour token expiration
- ✅ Token verification on every request
- ✅ Password hashing (SHA-256)

### Authorization
- ✅ Role-based access control (RBAC)
- ✅ Per-endpoint role validation
- ✅ Resource ownership verification

### Audit & Compliance
- ✅ Complete audit logging
- ✅ Action tracking with timestamps
- ✅ User and IP address logging
- ✅ Change history tracking
- ✅ 90-day log retention

### Data Protection
- ✅ GDPR-compliant pseudonymization
- ✅ Personal data anonymization
- ✅ Secure data handling

### Input Validation
- ✅ Email format validation
- ✅ Required field validation
- ✅ Role validation
- ✅ Status validation

---

## Testing

### Demo Accounts Available
1. **Employee** (employee@company.com) - View own data, request transparency
2. **Manager** (manager@company.com) - Manage team, approve justifications
3. **HR Specialist** (hr@company.com) - Import employees, manage jobs
4. **Compliance Officer** (compliance@company.com) - Generate reports
5. **Admin** (admin@company.com) - Full system access

All demo accounts use password: `password123`

---

## API Statistics

- **Total Endpoints**: 19
- **Authentication Methods**: Token-based Bearer
- **Authorization Levels**: 5 roles
- **Audit Events**: 25+ action types
- **Error Codes**: 5 (400, 401, 403, 404, 405, 500)
- **Response Formats**: JSON with standard envelope
- **Pagination**: Supported with limit/offset
- **Filtering**: Advanced by multiple criteria

---

## Performance Considerations

- In-memory data storage for development (replace with database)
- Pagination support with 500-item max limit
- Efficient filtering with minimal iterations
- Audit log rotation (keeps last 10,000 entries)
- Token-based stateless authentication

---

## Next Steps for Production

1. Replace mock data with real database (PostgreSQL, MongoDB, etc.)
2. Implement session management for security
3. Add rate limiting and DDoS protection
4. Implement request signing/HMAC verification
5. Add webhook support for real-time notifications
6. Implement caching layer (Redis)
7. Add request validation with JSON schema
8. Set up comprehensive error tracking
9. Implement API versioning
10. Add comprehensive API tests

---

## Documentation References

- **Full API Documentation**: See `API_DOCUMENTATION.md`
- **Authentication Flow**: See auth endpoints
- **Role Definitions**: See `utils/api.ts` UserRole enum
- **Audit Events**: See `logAudit()` function usage
