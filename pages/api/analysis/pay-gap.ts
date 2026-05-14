import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, withRole, UserRole, sendSuccess, sendError, logAudit, getClientIp } from '@/utils/api';

// Mock pay gap data
const mockPayGapData = {
  'Developers': {
    jobGroup: 'Developers',
    totalEmployees: 42,
    maleCount: 28,
    femaleCount: 14,
    averageMaleSalary: 5200,
    averageFemaleSalary: 4950,
    payGap: 4.81,
    currency: 'EUR',
    analysisDate: '2024-05-14',
    justifications: 3,
    pendingJustifications: 1
  },
  'Managers': {
    jobGroup: 'Managers',
    totalEmployees: 15,
    maleCount: 10,
    femaleCount: 5,
    averageMaleSalary: 6500,
    averageFemaleSalary: 6200,
    payGap: 4.62,
    currency: 'EUR',
    analysisDate: '2024-05-14',
    justifications: 2,
    pendingJustifications: 0
  },
  'Support': {
    jobGroup: 'Support',
    totalEmployees: 18,
    maleCount: 8,
    femaleCount: 10,
    averageMaleSalary: 3200,
    averageFemaleSalary: 3150,
    payGap: 1.56,
    currency: 'EUR',
    analysisDate: '2024-05-14',
    justifications: 0,
    pendingJustifications: 0
  }
};

export default withAuth(
  withRole(UserRole.MANAGER, UserRole.HR_SPECIALIST, UserRole.COMPLIANCE_OFFICER, UserRole.ADMIN)(
    async (req, res, user) => {
      const clientIp = getClientIp(req);

      if (req.method === 'GET') {
        try {
          const { jobGroup } = req.query;

          if (jobGroup && typeof jobGroup === 'string') {
            const data = (mockPayGapData as any)[jobGroup];
            if (!data) {
              return sendError(res, 'Job group not found', 404);
            }

            logAudit(user.userId, user.email, 'VIEW_PAY_GAP_DETAIL', 'ANALYSIS', jobGroup, 200,
              { jobGroup }, clientIp);
            return sendSuccess(res, data);
          }

          // Return all job groups
          const allData = Object.values(mockPayGapData);

          logAudit(user.userId, user.email, 'VIEW_PAY_GAP_SUMMARY', 'ANALYSIS', 'all', 200,
            undefined, clientIp);
          return sendSuccess(res, {
            summary: {
              totalJobGroups: allData.length,
              overallPayGap: 3.65,
              totalEmployees: allData.reduce((sum: number, g: any) => sum + g.totalEmployees, 0),
              analysisDate: new Date().toISOString()
            },
            jobGroups: allData
          });
        } catch (error) {
          console.error('Pay gap analysis error:', error);
          return sendError(res, 'Internal server error', 500);
        }
      }

      return sendError(res, 'Method not allowed', 405);
    }
  )
);
