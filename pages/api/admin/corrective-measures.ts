import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, withRole, UserRole, sendSuccess, sendError, logAudit, getClientIp } from '@/utils/api';

interface CorrectiveMeasure {
  id: string;
  jobCode: string;
  department: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  payGapPercentage: number;
  targetSalaryMin: number;
  targetSalaryMax: number;
  currentSalaryMin: number;
  currentSalaryMax: number;
  description: string;
  deadline: string;
  createdDate: string;
  completionDate?: string;
  responsiblePerson: string;
  notes?: string;
}

// Mock corrective measures data
let correctiveMeasures: CorrectiveMeasure[] = [
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
    createdDate: '2024-03-15',
    responsiblePerson: 'HR Manager',
    notes: 'În progres - așteptare aprobare buget'
  },
  {
    id: 'cm-002',
    jobCode: 'MGR-001',
    department: 'Managers',
    status: 'COMPLETED',
    payGapPercentage: 8.3,
    targetSalaryMin: 6500,
    targetSalaryMax: 7800,
    currentSalaryMin: 6000,
    currentSalaryMax: 7200,
    description: 'Creștere salariu pentru manager senior',
    deadline: '2024-05-31',
    createdDate: '2024-02-01',
    completionDate: '2024-05-28',
    responsiblePerson: 'CFO',
    notes: 'Implementat cu succes'
  },
  {
    id: 'cm-003',
    jobCode: 'DEV-SR-001',
    department: 'Developers',
    status: 'PENDING',
    payGapPercentage: 15.2,
    targetSalaryMin: 5200,
    targetSalaryMax: 6200,
    currentSalaryMin: 4800,
    currentSalaryMax: 5800,
    description: 'Ajustare salariu developer senior',
    deadline: '2024-07-31',
    createdDate: '2024-04-01',
    responsiblePerson: 'HR Director',
    notes: 'Așteptare semnătură'
  },
  {
    id: 'cm-004',
    jobCode: 'MGR-002',
    department: 'Managers',
    status: 'ON_HOLD',
    payGapPercentage: 20.0,
    targetSalaryMin: 7000,
    targetSalaryMax: 8500,
    currentSalaryMin: 6000,
    currentSalaryMax: 7200,
    description: 'Restructurare salariu pentru manager proiect',
    deadline: '2024-08-31',
    createdDate: '2024-03-20',
    responsiblePerson: 'HR Manager',
    notes: 'Pe hold - clarificări necesare pe directive'
  }
];

export default withAuth(
  withRole(UserRole.COMPLIANCE_OFFICER, UserRole.ADMIN)(
    async (req, res, user) => {
      const clientIp = getClientIp(req);

      if (req.method === 'GET') {
        try {
          const { status, department, jobCode, limit = '50', offset = '0' } = req.query;

          let filtered = [...correctiveMeasures];

          // Apply filters
          if (status && typeof status === 'string') {
            filtered = filtered.filter(m => m.status === status.toUpperCase());
          }
          if (department && typeof department === 'string') {
            filtered = filtered.filter(m => m.department === department);
          }
          if (jobCode && typeof jobCode === 'string') {
            filtered = filtered.filter(m => m.jobCode === jobCode);
          }

          // Sort by createdDate descending (newest first)
          filtered.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());

          // Pagination
          const limitNum = Math.min(parseInt(limit as string) || 50, 500);
          const offsetNum = parseInt(offset as string) || 0;
          const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

          logAudit(user.userId, user.email, 'VIEW_CORRECTIVE_MEASURES', 'ADMIN', 'corrective_measures', 200,
            { count: paginated.length, total: filtered.length }, clientIp);

          return sendSuccess(res, {
            total: filtered.length,
            limit: limitNum,
            offset: offsetNum,
            count: paginated.length,
            measures: paginated
          });
        } catch (error) {
          console.error('Get corrective measures error:', error);
          return sendError(res, 'Internal server error', 500);
        }
      }

      if (req.method === 'PUT') {
        try {
          const { id } = req.query;
          const { status, notes, completionDate } = req.body;

          if (!id || typeof id !== 'string') {
            return sendError(res, 'Missing or invalid measure ID', 400);
          }

          const measureIndex = correctiveMeasures.findIndex(m => m.id === id);
          if (measureIndex === -1) {
            return sendError(res, 'Corrective measure not found', 404);
          }

          const measure = correctiveMeasures[measureIndex];
          if (status && typeof status === 'string') {
            measure.status = status as any;
          }
          if (notes && typeof notes === 'string') {
            measure.notes = notes;
          }
          if (completionDate && typeof completionDate === 'string' && status === 'COMPLETED') {
            measure.completionDate = completionDate;
          }

          logAudit(user.userId, user.email, 'UPDATE_CORRECTIVE_MEASURE', 'CORRECTIVE_MEASURES', id, 200,
            { status, notes }, clientIp);

          return sendSuccess(res, measure);
        } catch (error) {
          console.error('Update corrective measure error:', error);
          return sendError(res, 'Internal server error', 500);
        }
      }

      return sendError(res, 'Method not allowed', 405);
    }
  )
);
