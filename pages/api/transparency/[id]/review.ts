import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, withRole, UserRole, sendSuccess, sendError, logAudit, getClientIp } from '@/utils/api';

// Mock transparency requests database
const transparencyDb: Record<string, any> = {
  'tr-001': {
    id: 'tr-001',
    employeeId: 'emp-001',
    peerGroup: 'Developers',
    jobLevel: 'Senior',
    status: 'PENDING'
  },
  'tr-002': {
    id: 'tr-002',
    employeeId: 'emp-002',
    peerGroup: 'Support',
    jobLevel: 'Standard',
    status: 'PENDING'
  }
};

export default withAuth(
  withRole(UserRole.HR_SPECIALIST, UserRole.COMPLIANCE_OFFICER, UserRole.ADMIN)(
    async (req, res, user) => {
      const { id } = req.query;
      const clientIp = getClientIp(req);

      if (typeof id !== 'string') {
        return sendError(res, 'Invalid request ID', 400);
      }

      if (req.method === 'POST') {
        try {
          const { action, salary, salaryRange, peerCount, denialReason } = req.body;

          if (!action || !['approve', 'deny'].includes(action)) {
            return sendError(res, 'Invalid action. Must be "approve" or "deny"', 400);
          }

          const request = transparencyDb[id];
          if (!request) {
            return sendError(res, 'Transparency request not found', 404);
          }

          if (request.status !== 'PENDING') {
            return sendError(res, 'Request is not in pending status', 400);
          }

          const updated = {
            ...request,
            status: action === 'approve' ? 'APPROVED' : 'DENIED',
            reviewedBy: user.userId,
            reviewedAt: new Date().toISOString(),
            averageSalary: action === 'approve' ? salary : null,
            salaryRange: action === 'approve' ? salaryRange : null,
            peerCount: action === 'approve' ? peerCount : null,
            denialReason: action === 'deny' ? denialReason : null
          };

          transparencyDb[id] = updated;

          logAudit(user.userId, user.email, `${action.toUpperCase()}_TRANSPARENCY_REQUEST`,
            'TRANSPARENCY', id, 200, { action, salary, peerCount }, clientIp);
          return sendSuccess(res, updated);
        } catch (error) {
          console.error('Review transparency request error:', error);
          return sendError(res, 'Internal server error', 500);
        }
      }

      return sendError(res, 'Method not allowed', 405);
    }
  )
);
