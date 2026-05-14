import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, sendSuccess, sendError } from '@/utils/api';

export default withAuth(async (req, res, user) => {
  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    return sendSuccess(res, {
      userId: user.userId,
      email: user.email,
      role: user.role,
      expiresAt: new Date(user.exp * 1000).toISOString()
    });
  } catch (error) {
    console.error('Verify error:', error);
    return sendError(res, 'Internal server error', 500);
  }
});
