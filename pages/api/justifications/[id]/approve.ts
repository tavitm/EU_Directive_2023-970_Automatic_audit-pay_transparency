import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, withRole, UserRole, sendSuccess, sendError, logAudit, getClientIp } from '@/utils/api';

// Mock justifications (in production, would be in database)
const justificationsDb: Record<string, any> = {
  'just-001': {
    id: 'just-001',
    jobGroup: 'Developers',
    payGap: 8.5,
    justificationText: 'Senior developers have higher salaries',
    status: 'PENDING'
  },
  'just-002': {
    id: 'just-002',
    jobGroup: 'Support',
    payGap: 2.1,
    justificationText: 'Minimal pay gap within acceptable deviation range',
    status: 'PENDING'
  }
};

export default withAuth(
  withRole(UserRole.COMPLIANCE_OFFICER, UserRole.ADMIN)(
    async (req, res, user) => {
      const { id } = req.query;
      const clientIp = getClientIp(req);

      if (typeof id !== 'string') {
        return sendError(res, 'Invalid justification ID', 400);
      }

      if (req.method === 'POST') {
        try {
          const { action, comments } = req.body;

          if (!action || !['approve', 'reject'].includes(action)) {
            return sendError(res, 'Invalid action. Must be "approve" or "reject"', 400);
          }

          const justification = justificationsDb[id];
          if (!justification) {
            return sendError(res, 'Justification not found', 404);
          }

          if (justification.status !== 'PENDING') {
            return sendError(res, 'Justification is not in pending status', 400);
          }

          const updated = {
            ...justification,
            status: action === 'approve' ? 'APPROVED' : 'REJECTED',
            approvedBy: user.userId,
            approvedAt: new Date().toISOString(),
            reviewComments: comments || null
          };

          justificationsDb[id] = updated;

          logAudit(user.userId, user.email, `${action.toUpperCase()}_JUSTIFICATION`,
            'JUSTIFICATIONS', id, 200, { action, comments }, clientIp);
          return sendSuccess(res, updated);
        } catch (error) {
          console.error('Approve/reject justification error:', error);
          return sendError(res, 'Internal server error', 500);
        }
      }

      return sendError(res, 'Method not allowed', 405);
    }
  )
);
