import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, sendSuccess, sendError, getClientIp, logAudit } from '@/utils/api';

export default withAuth(async (req, res, user) => {
  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const clientIp = getClientIp(req);

    logAudit(user.userId, user.email, 'LOGOUT', 'AUTH', 'logout', 200, undefined, clientIp);

    return sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return sendError(res, 'Internal server error', 500);
  }
});
