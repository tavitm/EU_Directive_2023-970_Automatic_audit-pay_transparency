import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, withRole, UserRole, sendSuccess, sendError, logAudit, getClientIp, auditLogs } from '@/utils/api';

export default withAuth(
  withRole(UserRole.COMPLIANCE_OFFICER, UserRole.ADMIN)(
    async (req, res, user) => {
      const clientIp = getClientIp(req);

      if (req.method === 'GET') {
        try {
          const { action, resource, userId, startDate, endDate, limit = '50', offset = '0' } = req.query;

          let filtered = [...auditLogs];

          // Apply filters
          if (action && typeof action === 'string') {
            filtered = filtered.filter(log => log.action === action);
          }
          if (resource && typeof resource === 'string') {
            filtered = filtered.filter(log => log.resource === resource);
          }
          if (userId && typeof userId === 'string') {
            filtered = filtered.filter(log => log.userId === userId);
          }
          if (startDate && typeof startDate === 'string') {
            const start = new Date(startDate);
            filtered = filtered.filter(log => new Date(log.timestamp) >= start);
          }
          if (endDate && typeof endDate === 'string') {
            const end = new Date(endDate);
            filtered = filtered.filter(log => new Date(log.timestamp) <= end);
          }

          // Sort by timestamp descending (newest first)
          filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

          // Pagination
          const limitNum = Math.min(parseInt(limit as string) || 50, 500);
          const offsetNum = parseInt(offset as string) || 0;
          const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

          logAudit(user.userId, user.email, 'VIEW_AUDIT_LOGS', 'ADMIN', 'audit_logs', 200,
            { count: paginated.length, total: filtered.length }, clientIp);

          return sendSuccess(res, {
            total: filtered.length,
            limit: limitNum,
            offset: offsetNum,
            count: paginated.length,
            logs: paginated
          });
        } catch (error) {
          console.error('Get audit logs error:', error);
          return sendError(res, 'Internal server error', 500);
        }
      }

      if (req.method === 'DELETE') {
        try {
          // Only allow deletion of audit logs older than 90 days
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

          const initialCount = auditLogs.length;
          const indicesToRemove: number[] = [];

          auditLogs.forEach((log, index) => {
            if (new Date(log.timestamp) < ninetyDaysAgo) {
              indicesToRemove.push(index);
            }
          });

          // Remove in reverse order to maintain indices
          for (let i = indicesToRemove.length - 1; i >= 0; i--) {
            auditLogs.splice(indicesToRemove[i], 1);
          }

          logAudit(user.userId, user.email, 'PURGE_AUDIT_LOGS', 'ADMIN', 'audit_logs', 200,
            { deleted: indicesToRemove.length }, clientIp);

          return sendSuccess(res, {
            message: `Purged ${indicesToRemove.length} audit logs older than 90 days`,
            deleted: indicesToRemove.length
          });
        } catch (error) {
          console.error('Purge audit logs error:', error);
          return sendError(res, 'Internal server error', 500);
        }
      }

      return sendError(res, 'Method not allowed', 405);
    }
  )
);
