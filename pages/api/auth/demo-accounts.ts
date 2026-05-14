import { NextApiRequest, NextApiResponse } from 'next';
import { sendSuccess, sendError } from '@/utils/api';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    return sendSuccess(res, {
      demoAccounts: [
        {
          email: 'employee@company.com',
          password: 'password123',
          role: 'EMPLOYEE',
          name: 'Ion Popescu',
          description: 'Employee - View personal salary, request transparency'
        },
        {
          email: 'manager@company.com',
          password: 'password123',
          role: 'MANAGER',
          name: 'Maria Ionescu',
          description: 'Manager - Manage team, approve justifications'
        },
        {
          email: 'hr@company.com',
          password: 'password123',
          role: 'HR_SPECIALIST',
          name: 'Alexandra Dumitrescu',
          description: 'HR Specialist - Import employees, manage jobs'
        },
        {
          email: 'compliance@company.com',
          password: 'password123',
          role: 'COMPLIANCE_OFFICER',
          name: 'Mihai Georgescu',
          description: 'Compliance Officer - Generate reports, view analytics'
        },
        {
          email: 'admin@company.com',
          password: 'password123',
          role: 'ADMIN',
          name: 'Administrator',
          description: 'Admin - Full system access'
        }
      ]
    });
  } catch (error) {
    console.error('Demo accounts error:', error);
    return sendError(res, 'Internal server error', 500);
  }
}
