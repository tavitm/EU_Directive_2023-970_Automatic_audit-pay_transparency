import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db_client';
import { verifyToken, canAccess } from '@/lib/auth_jwt';
import { extractTokenFromHeader } from '@/lib/auth_jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentication
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({ error: 'Missing authentication token' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Authorization - All authenticated users can list
    const { department, status, limit = 50, offset = 0 } = req.query;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (department) {
      whereClause += ` AND department = $${paramCount}`;
      params.push(department);
      paramCount++;
    }

    if (status) {
      whereClause += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM job_evaluations ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated results
    const listParams = [...params, parseInt(String(limit), 10), parseInt(String(offset), 10)];
    const result = await query(
      `SELECT id, job_code, job_title, department, job_level, job_family, status, created_at, activated_at
       FROM job_evaluations
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      listParams
    );

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        limit: parseInt(String(limit), 10),
        offset: parseInt(String(offset), 10),
      },
      jobEvaluations: result.rows.map((row: any) => ({
        id: row.id,
        jobCode: row.job_code,
        jobTitle: row.job_title,
        department: row.department,
        jobLevel: row.job_level,
        jobFamily: row.job_family,
        status: row.status,
        createdAt: row.created_at,
        activatedAt: row.activated_at,
      })),
    });
  } catch (error) {
    console.error('Job list error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve job evaluations',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    });
  }
}
