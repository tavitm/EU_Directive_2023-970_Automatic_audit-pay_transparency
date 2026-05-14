import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, withRole, UserRole, sendSuccess, sendError, logAudit, getClientIp } from '@/utils/api';

// Mock justifications data
let justifications = [
  {
    id: 'just-001',
    jobGroup: 'Developers',
    payGap: 8.5,
    justificationText: 'Senior developers have higher salaries due to experience and specialized skills',
    documentUrl: 'documents/justification-001.pdf',
    submittedBy: 'adm-001',
    submittedAt: '2024-03-15',
    status: 'APPROVED',
    approvedBy: 'com-001',
    approvedAt: '2024-03-20',
    reviewComments: 'Documentation satisfactory and compliant'
  },
  {
    id: 'just-002',
    jobGroup: 'Support',
    payGap: 2.1,
    justificationText: 'Minimal pay gap within acceptable deviation range',
    documentUrl: 'documents/justification-002.pdf',
    submittedBy: 'hr-001',
    submittedAt: '2024-04-10',
    status: 'PENDING',
    approvedBy: null,
    approvedAt: null,
    reviewComments: null
  },
  {
    id: 'just-003',
    jobGroup: 'Managers',
    payGap: 4.62,
    justificationText: 'Pay gap due to performance bonuses for high-performing male managers',
    documentUrl: 'documents/justification-003.pdf',
    submittedBy: 'adm-001',
    submittedAt: '2024-05-01',
    status: 'REJECTED',
    approvedBy: 'com-001',
    approvedAt: '2024-05-05',
    reviewComments: 'Insufficient documentation for bonus allocation justification'
  }
];

export default withAuth(
  withRole(UserRole.HR_SPECIALIST, UserRole.COMPLIANCE_OFFICER, UserRole.ADMIN)(
    async (req, res, user) => {
      const clientIp = getClientIp(req);

      if (req.method === 'GET') {
        try {
          const { status } = req.query;

          let filtered = justifications;
          if (status && typeof status === 'string') {
            filtered = justifications.filter(j => j.status === status.toUpperCase());
          }

          logAudit(user.userId, user.email, 'LIST_JUSTIFICATIONS', 'JUSTIFICATIONS', 'all', 200,
            { count: filtered.length, status }, clientIp);
          return sendSuccess(res, {
            total: filtered.length,
            justifications: filtered
          });
        } catch (error) {
          console.error('List justifications error:', error);
          return sendError(res, 'Internal server error', 500);
        }
      }

      if (req.method === 'POST') {
        try {
          const { jobGroup, payGap, justificationText, documentUrl } = req.body;

          if (!jobGroup || !justificationText) {
            return sendError(res, 'Missing required fields', 400);
          }

          const newJustification = {
            id: `just-${Date.now()}`,
            jobGroup,
            payGap: payGap || 0,
            justificationText,
            documentUrl: documentUrl || null,
            submittedBy: user.userId,
            submittedAt: new Date().toISOString(),
            status: 'PENDING',
            approvedBy: null,
            approvedAt: null,
            reviewComments: null
          };

          justifications.push(newJustification);

          logAudit(user.userId, user.email, 'SUBMIT_JUSTIFICATION', 'JUSTIFICATIONS',
            newJustification.id, 201, newJustification, clientIp);
          return sendSuccess(res, newJustification, 201);
        } catch (error) {
          console.error('Create justification error:', error);
          return sendError(res, 'Internal server error', 500);
        }
      }

      return sendError(res, 'Method not allowed', 405);
    }
  )
);
