import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, sendSuccess, sendError, logAudit, getClientIp, mockUsers } from '@/utils/api';

export default withAuth(async (req, res, user) => {
  const clientIp = getClientIp(req);

  if (req.method === 'GET') {
    try {
      // Find the user's full profile
      const fullUser = Object.values(mockUsers).find((u: any) => u.id === user.userId) as any;

      if (!fullUser) {
        return sendError(res, 'User not found', 404);
      }

      logAudit(user.userId, user.email, 'VIEW_PROFILE', 'PROFILE', user.userId, 200,
        undefined, clientIp);

      return sendSuccess(res, {
        id: fullUser.id,
        email: fullUser.email,
        name: fullUser.name,
        role: fullUser.role,
        department: fullUser.department
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, department } = req.body;

      // In production, update would persist to database
      logAudit(user.userId, user.email, 'UPDATE_PROFILE', 'PROFILE', user.userId, 200,
        { name, department }, clientIp);

      return sendSuccess(res, {
        id: user.userId,
        email: user.email,
        name: name || (mockUsers as any)[user.email]?.name,
        role: user.role,
        department: department || (mockUsers as any)[user.email]?.department,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  return sendError(res, 'Method not allowed', 405);
});
