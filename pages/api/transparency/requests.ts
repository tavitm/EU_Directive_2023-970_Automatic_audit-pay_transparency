import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, UserRole, sendSuccess, sendError, logAudit, getClientIp } from '@/utils/api';

// Mock transparency requests
let transparencyRequests = [
  {
    id: 'tr-001',
    employeeId: 'emp-001',
    peerGroup: 'Developers',
    jobLevel: 'Senior',
    department: 'Engineering',
    requestedAt: '2024-05-10',
    status: 'APPROVED',
    approvedAt: '2024-05-12',
    averageSalary: 5150,
    salaryRange: { min: 4800, max: 5800 },
    peerCount: 28,
    currency: 'EUR'
  },
  {
    id: 'tr-002',
    employeeId: 'emp-002',
    peerGroup: 'Support',
    jobLevel: 'Standard',
    department: 'Support',
    requestedAt: '2024-05-11',
    status: 'PENDING',
    approvedAt: null,
    averageSalary: null,
    salaryRange: null,
    peerCount: null,
    currency: 'EUR'
  }
];

export default withAuth(async (req, res, user) => {
  const clientIp = getClientIp(req);

  if (req.method === 'GET') {
    try {
      // Employees can only see their own requests
      let filtered = transparencyRequests;
      if (user.role === UserRole.EMPLOYEE) {
        filtered = transparencyRequests.filter(tr => tr.employeeId === user.userId);
      }

      logAudit(user.userId, user.email, 'LIST_TRANSPARENCY_REQUESTS', 'TRANSPARENCY', 'all', 200,
        { count: filtered.length }, clientIp);
      return sendSuccess(res, {
        total: filtered.length,
        requests: filtered
      });
    } catch (error) {
      console.error('List transparency requests error:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  if (req.method === 'POST') {
    try {
      if (user.role !== UserRole.EMPLOYEE) {
        return sendError(res, 'Only employees can request transparency', 403);
      }

      const { peerGroup, jobLevel, department } = req.body;

      if (!peerGroup || !jobLevel) {
        return sendError(res, 'Missing required fields', 400);
      }

      const newRequest = {
        id: `tr-${Date.now()}`,
        employeeId: user.userId,
        peerGroup,
        jobLevel,
        department: department || 'Unknown',
        requestedAt: new Date().toISOString(),
        status: 'PENDING',
        approvedAt: null,
        averageSalary: null,
        salaryRange: null,
        peerCount: null,
        currency: 'EUR'
      };

      transparencyRequests.push(newRequest);

      logAudit(user.userId, user.email, 'CREATE_TRANSPARENCY_REQUEST', 'TRANSPARENCY',
        newRequest.id, 201, newRequest, clientIp);
      return sendSuccess(res, newRequest, 201);
    } catch (error) {
      console.error('Create transparency request error:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  return sendError(res, 'Method not allowed', 405);
});
