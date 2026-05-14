import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, withRole, UserRole, sendSuccess, sendError, logAudit, getClientIp } from '@/utils/api';

export default withAuth(
  withRole(UserRole.COMPLIANCE_OFFICER, UserRole.ADMIN)(
    async (req, res, user) => {
      const clientIp = getClientIp(req);

      if (req.method === 'GET') {
        try {
          const { reportType } = req.query;

          let reportData = {};

          switch (reportType) {
            case 'overview':
              reportData = {
                generatedAt: new Date().toISOString(),
                complianceStatus: 'PARTIALLY_COMPLIANT',
                overallPayGap: 3.65,
                jobGroupsAnalyzed: 3,
                justificationsSubmitted: 3,
                justificationsApproved: 2,
                justificationsPending: 1,
                justificationsRejected: 0,
                transparencyRequests: 15,
                transparencyApproved: 14,
                transparencyDenied: 1,
                employeesAnalyzed: 75,
                criticalAreas: [
                  { jobGroup: 'Developers', payGap: 8.5, severity: 'HIGH' },
                  { jobGroup: 'Managers', payGap: 4.62, severity: 'MEDIUM' }
                ]
              };
              break;

            case 'analysis':
              reportData = {
                generatedAt: new Date().toISOString(),
                jobGroups: [
                  {
                    name: 'Developers',
                    totalEmployees: 42,
                    payGap: 8.5,
                    maleAverage: 5200,
                    femaleAverage: 4950,
                    justified: true,
                    justificationStatus: 'APPROVED'
                  },
                  {
                    name: 'Managers',
                    totalEmployees: 15,
                    payGap: 4.62,
                    maleAverage: 6500,
                    femaleAverage: 6200,
                    justified: true,
                    justificationStatus: 'REJECTED'
                  },
                  {
                    name: 'Support',
                    totalEmployees: 18,
                    payGap: 1.56,
                    maleAverage: 3200,
                    femaleAverage: 3150,
                    justified: false,
                    justificationStatus: 'NOT_REQUIRED'
                  }
                ]
              };
              break;

            case 'justifications':
              reportData = {
                generatedAt: new Date().toISOString(),
                totalJustifications: 3,
                approved: 2,
                rejected: 1,
                pending: 0,
                justifications: [
                  {
                    id: 'just-001',
                    jobGroup: 'Developers',
                    status: 'APPROVED',
                    submittedAt: '2024-03-15',
                    approvedAt: '2024-03-20'
                  },
                  {
                    id: 'just-002',
                    jobGroup: 'Managers',
                    status: 'REJECTED',
                    submittedAt: '2024-05-01',
                    rejectedAt: '2024-05-05'
                  }
                ]
              };
              break;

            case 'trends':
              reportData = {
                generatedAt: new Date().toISOString(),
                timeframe: 'LAST_12_MONTHS',
                payGapTrend: [
                  { month: 'May 2023', payGap: 5.2 },
                  { month: 'Aug 2023', payGap: 4.8 },
                  { month: 'Nov 2023', payGap: 4.3 },
                  { month: 'Feb 2024', payGap: 3.9 },
                  { month: 'May 2024', payGap: 3.65 }
                ],
                improvementRate: 29.8,
                forecast6Months: 3.2
              };
              break;

            default:
              return sendError(res, 'Invalid report type', 400);
          }

          logAudit(user.userId, user.email, 'GENERATE_REPORT', 'REPORTS', reportType || 'all', 200,
            { reportType }, clientIp);
          return sendSuccess(res, reportData);
        } catch (error) {
          console.error('Generate report error:', error);
          return sendError(res, 'Internal server error', 500);
        }
      }

      if (req.method === 'POST') {
        try {
          const { format, reportType } = req.body;

          if (!format || !['pdf', 'excel', 'csv'].includes(format)) {
            return sendError(res, 'Invalid format. Must be pdf, excel, or csv', 400);
          }

          logAudit(user.userId, user.email, 'EXPORT_REPORT', 'REPORTS', reportType || 'all', 200,
            { format, reportType }, clientIp);

          return sendSuccess(res, {
            message: 'Report export initiated',
            downloadUrl: `/reports/export/${reportType}-${Date.now()}.${format}`,
            format,
            expiresIn: 3600
          });
        } catch (error) {
          console.error('Export report error:', error);
          return sendError(res, 'Internal server error', 500);
        }
      }

      return sendError(res, 'Method not allowed', 405);
    }
  )
);
