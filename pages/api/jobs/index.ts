import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, withRole, UserRole, sendSuccess, sendError, logAudit, getClientIp } from '@/utils/api';

// Mock job evaluations data
let jobEvaluations = [
  {
    id: 'job-001',
    title: 'Senior Developer',
    jobGroup: 'Developers',
    level: 'Senior',
    pointValue: 450,
    salaryMin: 4800,
    salaryMax: 5800,
    description: 'Senior software engineer with 5+ years experience',
    createdAt: '2024-01-15',
    updatedAt: '2024-05-14',
    createdBy: 'adm-001',
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
    description: 'Software engineer with 0-2 years experience',
    createdAt: '2024-01-15',
    updatedAt: '2024-05-14',
    createdBy: 'adm-001',
    status: 'ACTIVE'
  },
  {
    id: 'job-003',
    title: 'Engineering Manager',
    jobGroup: 'Managers',
    level: 'Manager',
    pointValue: 550,
    salaryMin: 6000,
    salaryMax: 7200,
    description: 'Manager responsible for engineering team',
    createdAt: '2024-02-01',
    updatedAt: '2024-05-14',
    createdBy: 'adm-001',
    status: 'ACTIVE'
  }
];

export default withAuth(
  withRole(UserRole.HR_SPECIALIST, UserRole.COMPLIANCE_OFFICER, UserRole.ADMIN)(
    async (req, res, user) => {
      const clientIp = getClientIp(req);

      if (req.method === 'GET') {
        try {
          const { status } = req.query;

          let filtered = jobEvaluations;
          if (status && typeof status === 'string') {
            filtered = jobEvaluations.filter(j => j.status === status.toUpperCase());
          }

          logAudit(user.userId, user.email, 'LIST_JOBS', 'JOBS', 'all', 200,
            { count: filtered.length }, clientIp);
          return sendSuccess(res, {
            total: filtered.length,
            jobs: filtered
          });
        } catch (error) {
          console.error('List jobs error:', error);
          return sendError(res, 'Internal server error', 500);
        }
      }

      if (req.method === 'POST') {
        try {
          const { title, jobGroup, level, pointValue, salaryMin, salaryMax, description } = req.body;

          if (!title || !jobGroup || !level || !pointValue) {
            return sendError(res, 'Missing required fields', 400);
          }

          const newJob = {
            id: `job-${Date.now()}`,
            title,
            jobGroup,
            level,
            pointValue,
            salaryMin,
            salaryMax,
            description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: user.userId,
            status: 'ACTIVE'
          };

          jobEvaluations.push(newJob);

          logAudit(user.userId, user.email, 'CREATE_JOB', 'JOBS', newJob.id, 201,
            newJob, clientIp);
          return sendSuccess(res, newJob, 201);
        } catch (error) {
          console.error('Create job error:', error);
          return sendError(res, 'Internal server error', 500);
        }
      }

      return sendError(res, 'Method not allowed', 405);
    }
  )
);
