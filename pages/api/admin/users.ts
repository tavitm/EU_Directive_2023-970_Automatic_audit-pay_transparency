import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, withRole, UserRole, sendSuccess, sendError, logAudit, getClientIp } from '@/utils/api';

// Mock users database
let usersDb = [
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
];

export default withAuth(
  withRole(UserRole.ADMIN)(
    async (req, res, user) => {
      const clientIp = getClientIp(req);

      if (req.method === 'GET') {
        try {
          const { role, status } = req.query;

          let filtered = usersDb;
          if (role && typeof role === 'string') {
            filtered = filtered.filter(u => u.role === role.toUpperCase());
          }
          if (status && typeof status === 'string') {
            filtered = filtered.filter(u => u.status === status.toUpperCase());
          }

          logAudit(user.userId, user.email, 'LIST_USERS', 'ADMIN', 'all', 200,
            { count: filtered.length }, clientIp);
          return sendSuccess(res, {
            total: filtered.length,
            users: filtered
          });
        } catch (error) {
          console.error('List users error:', error);
          return sendError(res, 'Internal server error', 500);
        }
      }

      if (req.method === 'POST') {
        try {
          const { email, name, role, department } = req.body;

          if (!email || !name || !role) {
            return sendError(res, 'Missing required fields', 400);
          }

          if (!Object.values(UserRole).includes(role)) {
            return sendError(res, 'Invalid role', 400);
          }

          const newUser = {
            id: `user-${Date.now()}`,
            email,
            name,
            role,
            department: department || 'Unassigned',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            lastLogin: null
          };

          usersDb.push(newUser);

          logAudit(user.userId, user.email, 'CREATE_USER', 'ADMIN', newUser.id, 201,
            newUser, clientIp);
          return sendSuccess(res, newUser, 201);
        } catch (error) {
          console.error('Create user error:', error);
          return sendError(res, 'Internal server error', 500);
        }
      }

      return sendError(res, 'Method not allowed', 405);
    }
  )
);
