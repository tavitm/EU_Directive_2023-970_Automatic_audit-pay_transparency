import { NextApiRequest, NextApiResponse } from 'next';
import {
  mockUsers,
  hashPassword,
  generateToken,
  sendSuccess,
  sendError,
  isValidEmail,
  getClientIp,
  logAudit
} from '@/utils/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const { email, password } = req.body;
    const clientIp = getClientIp(req);

    // Validate input
    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    if (!isValidEmail(email)) {
      return sendError(res, 'Invalid email format', 400);
    }

    // Find user
    const user = (mockUsers as any)[email];
    if (!user) {
      logAudit('unknown', email, 'LOGIN_FAILED', 'AUTH', 'login', 401,
        { reason: 'user_not_found' }, clientIp);
      return sendError(res, 'Invalid email or password', 401);
    }

    // Verify password
    const passwordHash = hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      logAudit(user.id, email, 'LOGIN_FAILED', 'AUTH', 'login', 401,
        { reason: 'invalid_password' }, clientIp);
      return sendError(res, 'Invalid email or password', 401);
    }

    // Generate token
    const token = generateToken(user);

    logAudit(user.id, email, 'LOGIN_SUCCESS', 'AUTH', 'login', 200, undefined, clientIp);

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 'Internal server error', 500);
  }
}
