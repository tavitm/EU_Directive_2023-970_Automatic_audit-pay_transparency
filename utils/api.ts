// API Utilities and Common Response Handlers
import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  HR_SPECIALIST = 'HR_SPECIALIST',
  COMPLIANCE_OFFICER = 'COMPLIANCE_OFFICER',
  ADMIN = 'ADMIN'
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode: number;
}

export interface AuthToken {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Mock database - in production, replace with actual database calls
export const mockUsers = {
  'employee@company.com': {
    id: 'emp-001',
    email: 'employee@company.com',
    name: 'Ion Popescu',
    role: UserRole.EMPLOYEE,
    passwordHash: hashPassword('password123'),
    department: 'Engineering',
    jobGroup: 'Developers'
  },
  'manager@company.com': {
    id: 'mgr-001',
    email: 'manager@company.com',
    name: 'Maria Ionescu',
    role: UserRole.MANAGER,
    passwordHash: hashPassword('password123'),
    department: 'Engineering',
    managedEmployees: ['emp-001']
  },
  'hr@company.com': {
    id: 'hr-001',
    email: 'hr@company.com',
    name: 'Alexandra Dumitrescu',
    role: UserRole.HR_SPECIALIST,
    passwordHash: hashPassword('password123'),
    department: 'HR'
  },
  'compliance@company.com': {
    id: 'com-001',
    email: 'compliance@company.com',
    name: 'Mihai Georgescu',
    role: UserRole.COMPLIANCE_OFFICER,
    passwordHash: hashPassword('password123'),
    department: 'Compliance'
  },
  'admin@company.com': {
    id: 'adm-001',
    email: 'admin@company.com',
    name: 'Administrator',
    role: UserRole.ADMIN,
    passwordHash: hashPassword('password123'),
    department: 'IT'
  }
};

export const mockTokens: Record<string, AuthToken> = {};

/**
 * Hash a password using SHA-256
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Generate JWT-like token
 */
export function generateToken(user: any): string {
  const token = Buffer.from(JSON.stringify({
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  })).toString('base64');

  mockTokens[token] = JSON.parse(Buffer.from(token, 'base64').toString());
  return token;
}

/**
 * Verify and decode token
 */
export function verifyToken(token: string): AuthToken | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString()) as AuthToken;
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expired
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Get authorization header token
 */
export function getTokenFromRequest(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  return null;
}

/**
 * Middleware: Authenticate request
 */
export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, user: AuthToken) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing token',
        statusCode: 401
      } as ApiResponse);
    }

    const user = verifyToken(token);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or expired token',
        statusCode: 401
      } as ApiResponse);
    }

    return handler(req, res, user);
  };
}

/**
 * Middleware: Authorize by role
 */
export function withRole(...allowedRoles: UserRole[]) {
  return (
    handler: (req: NextApiRequest, res: NextApiResponse, user: AuthToken) => Promise<void> | void
  ) => {
    return withAuth(async (req, res, user) => {
      if (!allowedRoles.includes(user.role as UserRole)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Insufficient permissions',
          statusCode: 403
        } as ApiResponse);
      }

      return handler(req, res, user);
    });
  };
}

/**
 * Middleware: Validate HTTP method
 */
export function withMethod(...methods: string[]) {
  return (
    handler: (req: NextApiRequest, res: NextApiResponse, user?: AuthToken) => Promise<void> | void
  ) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      if (!methods.includes(req.method || '')) {
        return res.status(405).json({
          success: false,
          error: `Method ${req.method} not allowed`,
          statusCode: 405
        } as ApiResponse);
      }

      return handler(req, res);
    };
  };
}

/**
 * Send success response
 */
export function sendSuccess<T>(
  res: NextApiResponse,
  data: T,
  statusCode: number = 200
) {
  return res.status(statusCode).json({
    success: true,
    data,
    statusCode
  } as ApiResponse<T>);
}

/**
 * Send error response
 */
export function sendError(
  res: NextApiResponse,
  error: string,
  statusCode: number = 400
) {
  return res.status(statusCode).json({
    success: false,
    error,
    statusCode
  } as ApiResponse);
}

/**
 * Pseudonymize PII data for GDPR compliance
 */
export function pseudonymizeData(data: any, fieldsToHash: string[]): any {
  const pseudonymized = { ...data };

  fieldsToHash.forEach(field => {
    if (pseudonymized[field]) {
      pseudonymized[field] = crypto
        .createHash('sha256')
        .update(pseudonymized[field])
        .digest('hex');
    }
  });

  return pseudonymized;
}

/**
 * Log audit trail for compliance
 */
export interface AuditLog {
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  statusCode: number;
}

// In-memory audit log (replace with database in production)
export const auditLogs: AuditLog[] = [];

export function logAudit(
  userId: string,
  userEmail: string,
  action: string,
  resource: string,
  resourceId: string,
  statusCode: number,
  changes?: Record<string, any>,
  ipAddress?: string
) {
  auditLogs.push({
    timestamp: new Date().toISOString(),
    userId,
    userEmail,
    action,
    resource,
    resourceId,
    changes,
    ipAddress: ipAddress || 'unknown',
    statusCode
  });

  // Keep only last 10000 logs in memory
  if (auditLogs.length > 10000) {
    auditLogs.shift();
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * Get client IP address
 */
export function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  return typeof forwarded === 'string' ? forwarded.split(',')[0] :
         (req.socket?.remoteAddress || 'unknown');
}
