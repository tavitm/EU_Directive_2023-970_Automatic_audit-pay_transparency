import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db_client';
import { verifyToken, canAccess } from '@/lib/auth_jwt';
import { extractTokenFromHeader } from '@/lib/auth_jwt';

/**
 * Activate a job evaluation methodology
 * Directive 2023/970 Article 3 - Methodology must be activated before salary data is uploaded
 * Only COMPLIANCE_OFFICER and ADMIN can activate
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
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

    // Authorization - COMPLIANCE_OFFICER (level 4) and above only
    if (!canAccess(decoded.role, 4)) {
      return res.status(403).json({
        error: 'Only Compliance Officer or Admin can activate job evaluations',
      });
    }

    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'Missing jobId' });
    }

    // Check current status
    const checkResult = await query(
      'SELECT id, status FROM job_evaluations WHERE id = $1',
      [jobId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job evaluation not found' });
    }

    const jobEval = checkResult.rows[0];

    if (jobEval.status !== 'DRAFT') {
      return res.status(400).json({
        error: `Cannot activate job with status ${jobEval.status}. Only DRAFT jobs can be activated.`,
      });
    }

    // Activate job evaluation
    const updateResult = await query(
      `UPDATE job_evaluations
       SET status = 'ACTIVE', activated_at = NOW(), activated_by = $1
       WHERE id = $2
       RETURNING id, job_code, status, activated_at`,
      [decoded.userId, jobId]
    );

    const activated = updateResult.rows[0];

    // Audit log
    await query(
      `INSERT INTO audit_logs
       (entity_type, entity_id, action, user_id_hash, details, timestamp)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        'JOB_EVALUATION',
        jobId,
        'ACTIVATE',
        decoded.userId,
        JSON.stringify({ previous_status: 'DRAFT' }),
      ]
    );

    return res.status(200).json({
      success: true,
      jobEvaluation: {
        id: activated.id,
        jobCode: activated.job_code,
        status: activated.status,
        activatedAt: activated.activated_at,
      },
      message: 'Job evaluation methodology activated successfully. Salary data import can now proceed.',
    });
  } catch (error) {
    console.error('Job activation error:', error);
    return res.status(500).json({
      error: 'Failed to activate job evaluation',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    });
  }
}
