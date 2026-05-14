import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, withRole, UserRole, sendSuccess, sendError, logAudit, getClientIp } from '@/utils/api';

// In production, this would be fetched from a database
const jobStorage: Record<string, any> = {
  'job-001': {
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
  }
};

export default withAuth(
  withRole(UserRole.HR_SPECIALIST, UserRole.COMPLIANCE_OFFICER, UserRole.ADMIN)(
    async (req, res, user) => {
      const { id } = req.query;
      const clientIp = getClientIp(req);

      if (typeof id !== 'string') {
        return sendError(res, 'Invalid job ID', 400);
      }

      if (req.method === 'GET') {
        try {
          const job = jobStorage[id];
          if (!job) {
            return sendError(res, 'Job not found', 404);
          }

          logAudit(user.userId, user.email, 'VIEW_JOB', 'JOBS', id, 200,
            undefined, clientIp);
          return sendSuccess(res, job);
        } catch (error) {
          console.error('Get job error:', error);
          return sendError(res, 'Internal server error', 500);
        }
      }

      if (req.method === 'PUT') {
        try {
          const job = jobStorage[id];
          if (!job) {
            return sendError(res, 'Job not found', 404);
          }

          const { title, jobGroup, level, pointValue, salaryMin, salaryMax, description } = req.body;

          const updated = {
            ...job,
            title: title || job.title,
            jobGroup: jobGroup || job.jobGroup,
            level: level || job.level,
            pointValue: pointValue || job.pointValue,
            salaryMin: salaryMin !== undefined ? salaryMin : job.salaryMin,
            salaryMax: salaryMax !== undefined ? salaryMax : job.salaryMax,
            description: description || job.description,
            updatedAt: new Date().toISOString()
          };

          jobStorage[id] = updated;

          logAudit(user.userId, user.email, 'UPDATE_JOB', 'JOBS', id, 200,
            updated, clientIp);
          return sendSuccess(res, updated);
        } catch (error) {
          console.error('Update job error:', error);
          return sendError(res, 'Internal server error', 500);
        }
      }

      if (req.method === 'DELETE') {
        try {
          const job = jobStorage[id];
          if (!job) {
            return sendError(res, 'Job not found', 404);
          }

          // Soft delete - mark as inactive
          jobStorage[id] = {
            ...job,
            status: 'INACTIVE',
            updatedAt: new Date().toISOString()
          };

          logAudit(user.userId, user.email, 'DELETE_JOB', 'JOBS', id, 200,
            { status: 'INACTIVE' }, clientIp);
          return sendSuccess(res, { message: 'Job deleted successfully' });
        } catch (error) {
          console.error('Delete job error:', error);
          return sendError(res, 'Internal server error', 500);
        }
      }

      return sendError(res, 'Method not allowed', 405);
    }
  )
);
