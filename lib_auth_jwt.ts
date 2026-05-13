import jwt from 'jsonwebtoken';
import { JWTPayload, User, UserRole } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_EXPIRY = '1h';

export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  };

  return jwt.sign(payload, JWT_SECRET);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

export function isTokenExpired(token: JWTPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now > token.exp;
}

export function hasRole(userRole: UserRole, requiredRole: UserRole | UserRole[]): boolean {
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  return userRole === requiredRole;
}

export function getRoleHierarchy(role: UserRole): number {
  const hierarchy: Record<UserRole, number> = {
    [UserRole.EMPLOYEE]: 1,
    [UserRole.MANAGER]: 2,
    [UserRole.HR_SPECIALIST]: 3,
    [UserRole.COMPLIANCE_OFFICER]: 4,
    [UserRole.CFO]: 5,
    [UserRole.ADMIN]: 6,
  };
  return hierarchy[role] || 0;
}

export function canAccess(userRole: UserRole, requiredMinLevel: number): boolean {
  return getRoleHierarchy(userRole) >= requiredMinLevel;
}
