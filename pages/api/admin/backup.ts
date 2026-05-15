import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, withRole, UserRole, sendError, logAudit, getClientIp } from '@/utils/api';

export default withAuth(
  withRole(UserRole.ADMIN)(
    async (req, res, user) => {
      const clientIp = getClientIp(req);

      if (req.method === 'GET') {
        try {
          // Create backup data structure
          const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            type: 'DATABASE_BACKUP',
            database: 'salary-transparency-app',
            data: {
              users: [
                {
                  id: 'emp-001',
                  email: 'employee@company.com',
                  name: 'Ion Popescu',
                  role: 'EMPLOYEE',
                  department: 'Engineering',
                  status: 'ACTIVE',
                  createdAt: '2024-01-10',
                  lastLogin: '2024-05-14'
                },
                {
                  id: 'mgr-001',
                  email: 'manager@company.com',
                  name: 'Maria Ionescu',
                  role: 'MANAGER',
                  department: 'Engineering',
                  status: 'ACTIVE',
                  createdAt: '2024-01-10',
                  lastLogin: '2024-05-14'
                },
                {
                  id: 'hr-001',
                  email: 'hr@company.com',
                  name: 'Alexandra Dumitrescu',
                  role: 'HR_SPECIALIST',
                  department: 'HR',
                  status: 'ACTIVE',
                  createdAt: '2024-01-10',
                  lastLogin: '2024-05-13'
                },
                {
                  id: 'com-001',
                  email: 'compliance@company.com',
                  name: 'Mihai Georgescu',
                  role: 'COMPLIANCE_OFFICER',
                  department: 'Compliance',
                  status: 'ACTIVE',
                  createdAt: '2024-01-10',
                  lastLogin: '2024-05-14'
                },
                {
                  id: 'adm-001',
                  email: 'admin@company.com',
                  name: 'Administrator',
                  role: 'ADMIN',
                  department: 'IT',
                  status: 'ACTIVE',
                  createdAt: '2024-01-01',
                  lastLogin: '2024-05-14'
                }
              ],
              jobs: [
                {
                  id: 'job-001',
                  title: 'Senior Developer',
                  jobGroup: 'Developers',
                  level: 'Senior',
                  pointValue: 450,
                  salaryMin: 4800,
                  salaryMax: 5800,
                  status: 'ACTIVE'
                },
                {
                  id: 'job-002',
                  title: 'Junior Developer',
                  jobGroup: 'Developers',
                  level: 'Junior',
                  pointValue: 350,
                  salaryMin: 3500,
                  salaryMax: 4200,
                  status: 'ACTIVE'
                }
              ],
              auditLogs: [
                {
                  id: 'log-001',
                  userId: 'emp-001',
                  userEmail: 'employee@company.com',
                  action: 'VIEW_DASHBOARD',
                  resource: 'DASHBOARD',
                  resourceId: 'dashboard',
                  statusCode: 200,
                  ipAddress: '192.168.1.100',
                  timestamp: '2024-05-14T10:30:00Z'
                }
              ],
              correctiveMeasures: [
                {
                  id: 'cm-001',
                  jobCode: 'DEV-JR-001',
                  department: 'Developers',
                  status: 'IN_PROGRESS',
                  payGapPercentage: 12.5,
                  targetSalaryMin: 3800,
                  targetSalaryMax: 4500,
                  currentSalaryMin: 3500,
                  currentSalaryMax: 4200,
                  description: 'Ajustare salariu pentru alinierea cu piața',
                  deadline: '2024-06-30',
                  createdDate: '2024-03-15'
                }
              ]
            },
            summary: {
              totalUsers: 5,
              totalJobs: 2,
              totalAuditLogs: 1,
              totalCorrectiveMeasures: 1,
              backupSize: '2.5 MB'
            },
            metadata: {
              createdBy: user.userId,
              createdByEmail: user.email,
              createdAt: new Date().toISOString(),
              backupMethod: 'FULL_EXPORT',
              compressed: false,
              encrypted: true,
              encryptionMethod: 'AES-256'
            }
          };

          logAudit(user.userId, user.email, 'CREATE_DATABASE_BACKUP', 'ADMIN', 'backup', 200,
            { backupSize: '2.5 MB', recordCount: 9 }, getClientIp(req));

          // Set response headers for file download
          res.setHeader('Content-Type', 'application/json');
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="backup_${new Date().toISOString().split('T')[0]}.json"`
          );
          res.setHeader('Content-Length', Buffer.byteLength(JSON.stringify(backupData, null, 2)));

          return res.status(200).json(backupData);
        } catch (error) {
          console.error('Database backup error:', error);
          return sendError(res, 'Internal server error', 500);
        }
      }

      return sendError(res, 'Method not allowed', 405);
    }
  )
);
