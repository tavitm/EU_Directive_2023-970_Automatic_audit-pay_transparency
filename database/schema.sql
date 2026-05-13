-- Directive 2023/970 & GDPR Compliant Database Schema
-- PostgreSQL 12+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE AUTHENTICATION & AUTHORIZATION TABLES
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('EMPLOYEE', 'MANAGER', 'HR_SPECIALIST', 'COMPLIANCE_OFFICER', 'CFO', 'ADMIN')),
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- JOB EVALUATION & METHODOLOGY TABLES (Directive Article 3)
-- ============================================================================

CREATE TABLE job_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_code VARCHAR(50) NOT NULL UNIQUE,
  job_title VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  job_level VARCHAR(50),
  job_family VARCHAR(100),
  evaluation_criteria JSONB NOT NULL, -- Array of {name, weight, description}
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  activated_by UUID REFERENCES users(id),
  activated_at TIMESTAMP,
  notes TEXT,
  CONSTRAINT valid_status CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED'))
);

CREATE INDEX idx_job_evaluations_status ON job_evaluations(status);
CREATE INDEX idx_job_evaluations_department ON job_evaluations(department);
CREATE INDEX idx_job_evaluations_job_code ON job_evaluations(job_code);

-- ============================================================================
-- EMPLOYEE DATA TABLES (GDPR Article 4(11) - Pseudonymization)
-- ============================================================================

-- Pseudonymized employee salary data
-- Original identifiable data (firstName, lastName, originalEmployeeId) is NOT stored
-- This ensures IRREVERSIBLE pseudonymization per GDPR Article 4(11)
CREATE TABLE employees_pseudonymous (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pseudonym_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hex
  salary DECIMAL(10, 2) NOT NULL,
  salary_hash VARCHAR(64) NOT NULL, -- Additional security layer
  gender VARCHAR(1) NOT NULL CHECK (gender IN ('M', 'F', 'O')),
  department VARCHAR(100) NOT NULL,
  job_code VARCHAR(50) NOT NULL REFERENCES job_evaluations(job_code),
  tenure_years INT DEFAULT 0,
  imported_at TIMESTAMP DEFAULT NOW(),
  import_batch_id UUID,
  -- Note: firstName, lastName, originalEmployeeId are PERMANENTLY DELETED
  -- and are NOT stored in this table or any other table
  CONSTRAINT valid_gender CHECK (gender IN ('M', 'F', 'O'))
);

CREATE INDEX idx_employees_gender ON employees_pseudonymous(gender);
CREATE INDEX idx_employees_department ON employees_pseudonymous(department);
CREATE INDEX idx_employees_job_code ON employees_pseudonymous(job_code);
CREATE INDEX idx_employees_import_batch ON employees_pseudonymous(import_batch_id);

-- ============================================================================
-- PAY GAP ANALYSIS TABLES (Directive Articles 5-7)
-- ============================================================================

CREATE TABLE pay_gap_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_date TIMESTAMP DEFAULT NOW(),
  report_period_year INT NOT NULL,
  filters JSONB, -- {department, jobCode, other filters}
  employee_count INT NOT NULL,
  male_count INT,
  female_count INT,
  other_count INT,
  male_avg_salary DECIMAL(10, 2),
  female_avg_salary DECIMAL(10, 2),
  raw_gap_percentage DECIMAL(5, 2), -- Calculated per Article 7 formula
  adjusted_gap_percentage DECIMAL(5, 2),
  t_statistic DECIMAL(10, 4),
  p_value DECIMAL(10, 4),
  significant_at_95 BOOLEAN,
  compliance_status VARCHAR(50) CHECK (compliance_status IN ('COMPLIANT', 'REQUIRES_JUSTIFICATION', 'CRITICAL')),
  generated_by UUID NOT NULL REFERENCES users(id),
  notes TEXT
);

CREATE INDEX idx_analyses_date ON pay_gap_analyses(analysis_date);
CREATE INDEX idx_analyses_status ON pay_gap_analyses(compliance_status);
CREATE INDEX idx_analyses_period ON pay_gap_analyses(report_period_year);

-- ============================================================================
-- JUSTIFICATION WORKFLOW TABLES (Directive Article 8)
-- ============================================================================

CREATE TABLE gap_justifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gap_analysis_id UUID REFERENCES pay_gap_analyses(id),
  department VARCHAR(100) NOT NULL,
  job_code VARCHAR(50) NOT NULL REFERENCES job_evaluations(job_code),
  gap_percentage DECIMAL(5, 2) NOT NULL,
  justification_reason TEXT NOT NULL,
  supporting_documents JSONB, -- Array of {fileName, uploadDate, url}
  proposed_measures JSONB NOT NULL, -- Array of {measure, expectedImpact, timeline}
  implementation_timeline VARCHAR(255),

  -- Workflow status
  status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED'
    CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED')),
  approval_stage VARCHAR(50) DEFAULT 'MANAGER_SUBMITTED'
    CHECK (approval_stage IN ('MANAGER_SUBMITTED', 'HR_REVIEWED', 'COMPLIANCE_APPROVED', 'REJECTED')),

  submitted_by UUID NOT NULL REFERENCES users(id),
  submitted_at TIMESTAMP DEFAULT NOW(),
  last_reviewed_at TIMESTAMP,

  CONSTRAINT article_8_reference CHECK (justification_reason IS NOT NULL)
);

CREATE INDEX idx_justifications_status ON gap_justifications(status);
CREATE INDEX idx_justifications_stage ON gap_justifications(approval_stage);
CREATE INDEX idx_justifications_department ON gap_justifications(department);

-- Multi-stage approval tracking
CREATE TABLE justification_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  justification_id UUID NOT NULL REFERENCES gap_justifications(id) ON DELETE CASCADE,
  approver_role VARCHAR(50) NOT NULL
    CHECK (approver_role IN ('HR_SPECIALIST', 'COMPLIANCE_OFFICER')),
  approval_status VARCHAR(50) NOT NULL
    CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  approval_order INT NOT NULL, -- Stage 1, 2, 3...
  reviewer_user_id UUID REFERENCES users(id),
  review_comments TEXT,
  review_date TIMESTAMP,

  CONSTRAINT one_approval_per_stage UNIQUE(justification_id, approval_order)
);

CREATE INDEX idx_approvals_justification ON justification_approvals(justification_id);
CREATE INDEX idx_approvals_status ON justification_approvals(approval_status);

-- ============================================================================
-- CORRECTIVE MEASURES TABLES (Directive Article 9)
-- ============================================================================

CREATE TABLE corrective_measures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  justification_id UUID NOT NULL REFERENCES gap_justifications(id),
  department VARCHAR(100) NOT NULL,
  job_code VARCHAR(50),
  measure_description TEXT NOT NULL,
  expected_impact DECIMAL(5, 2), -- Expected % gap reduction
  implementation_start_date DATE,
  expected_completion_date DATE,
  actual_completion_date DATE,

  status VARCHAR(50) NOT NULL DEFAULT 'PLANNED'
    CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),

  owner_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT article_9_reference CHECK (measure_description IS NOT NULL)
);

CREATE INDEX idx_measures_status ON corrective_measures(status);
CREATE INDEX idx_measures_department ON corrective_measures(department);
CREATE INDEX idx_measures_justification ON corrective_measures(justification_id);

-- ============================================================================
-- EMPLOYEE TRANSPARENCY REQUEST TABLES (Directive Article 10)
-- ============================================================================

CREATE TABLE transparency_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id_hash VARCHAR(64) NOT NULL UNIQUE, -- Contextual pseudonym
  employee_user_id_hash VARCHAR(64) NOT NULL, -- Pseudonym of requester
  job_code VARCHAR(50) NOT NULL REFERENCES job_evaluations(job_code),
  department VARCHAR(100) NOT NULL,
  requested_at TIMESTAMP DEFAULT NOW(),
  response_due_at TIMESTAMP NOT NULL, -- 15 days per Article 10
  response_provided_at TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'COMPLETED', 'EXPIRED')),

  -- Response data (all pseudonymized)
  peer_count INT,
  salary_median DECIMAL(10, 2),
  salary_q25 DECIMAL(10, 2),
  salary_q75 DECIMAL(10, 2),
  salary_min DECIMAL(10, 2),
  salary_max DECIMAL(10, 2),
  salary_average DECIMAL(10, 2),
  salary_std_dev DECIMAL(10, 2),

  CONSTRAINT article_10_reference CHECK (response_due_at IS NOT NULL)
);

CREATE INDEX idx_transparency_status ON transparency_requests(status);
CREATE INDEX idx_transparency_response_due ON transparency_requests(response_due_at);
CREATE INDEX idx_transparency_request_hash ON transparency_requests(request_id_hash);

-- ============================================================================
-- AUDIT & COMPLIANCE TABLES (GDPR Articles 5, 32 & Directive Article 15)
-- ============================================================================

-- Immutable append-only audit trail
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(100) NOT NULL, -- JOB_EVALUATION, EMPLOYEE_IMPORT, GAP_ANALYSIS, etc.
  entity_id VARCHAR(255),
  action VARCHAR(100) NOT NULL, -- CREATE, UPDATE, DELETE, ACTIVATE, APPROVE, etc.
  user_id_hash VARCHAR(64) NOT NULL, -- Pseudonymized user ID
  details JSONB, -- Additional context
  timestamp TIMESTAMP DEFAULT NOW(),
  ip_address INET,

  CONSTRAINT immutable CHECK (true) -- Cannot update, only insert
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id_hash);

-- Cannot be modified or deleted - enforce with trigger in application layer

-- ============================================================================
-- PSEUDONYMIZATION & DATA PROTECTION TABLES
-- ============================================================================

CREATE TABLE pseudonymization_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total_records INT NOT NULL,
  successful INT NOT NULL,
  failed INT NOT NULL,
  deleted_fields JSONB, -- {firstNames, lastNames, originalIds}
  algorithm VARCHAR(50) NOT NULL DEFAULT 'SHA-256',
  salt_hash VARCHAR(64) NOT NULL, -- Hash of salt, not salt itself
  timestamp TIMESTAMP DEFAULT NOW(),

  CONSTRAINT gdpr_4_11 CHECK (algorithm = 'SHA-256')
);

CREATE INDEX idx_pseudonym_reports_timestamp ON pseudonymization_reports(timestamp);

-- ============================================================================
-- SESSIONS & TOKEN MANAGEMENT
-- ============================================================================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP,
  ip_address INET
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ============================================================================
-- VIEWS FOR REPORTING & ANALYTICS
-- ============================================================================

-- Pay gap analysis by department
CREATE VIEW v_pay_gap_by_department AS
SELECT
  department,
  COUNT(*) as employee_count,
  SUM(CASE WHEN gender = 'M' THEN 1 ELSE 0 END) as male_count,
  SUM(CASE WHEN gender = 'F' THEN 1 ELSE 0 END) as female_count,
  AVG(CASE WHEN gender = 'M' THEN salary END) as male_avg_salary,
  AVG(CASE WHEN gender = 'F' THEN salary END) as female_avg_salary,
  ROUND(
    ((AVG(CASE WHEN gender = 'M' THEN salary END) -
      AVG(CASE WHEN gender = 'F' THEN salary END)) /
     AVG(CASE WHEN gender = 'F' THEN salary END) * 100)::numeric,
    2
  ) as gap_percentage
FROM employees_pseudonymous
GROUP BY department;

-- Active job evaluations
CREATE VIEW v_active_jobs AS
SELECT id, job_code, job_title, department, status
FROM job_evaluations
WHERE status = 'ACTIVE';

-- Pending justifications requiring action
CREATE VIEW v_pending_justifications AS
SELECT id, department, gap_percentage, approval_stage, submitted_at
FROM gap_justifications
WHERE status IN ('SUBMITTED', 'UNDER_REVIEW');

-- ============================================================================
-- CONSTRAINTS & DATA INTEGRITY
-- ============================================================================

-- Foreign key constraints are defined inline above
-- Additional check constraints are defined inline above

-- Create trigger to prevent audit log modifications (if DBMS supports)
-- CREATE TRIGGER prevent_audit_modification
-- BEFORE UPDATE OR DELETE ON audit_logs
-- FOR EACH ROW
-- BEGIN
--   RAISE EXCEPTION 'Audit logs are immutable';
-- END;

-- ============================================================================
-- INITIAL SETUP
-- ============================================================================

-- Create admin user (password should be set via application)
INSERT INTO users (email, role)
VALUES ('admin@directive2023970.local', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- Grant permissions (if using PostgreSQL roles)
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT INSERT, UPDATE ON job_evaluations, gap_justifications, corrective_measures TO app_user;
-- GRANT INSERT ON audit_logs TO app_user;

-- Create indexes for common queries
CREATE INDEX idx_employees_by_dept_gender ON employees_pseudonymous(department, gender);
CREATE INDEX idx_employees_by_job_gender ON employees_pseudonymous(job_code, gender);
