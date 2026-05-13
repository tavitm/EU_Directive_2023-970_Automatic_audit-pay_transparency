import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db_client';
import { verifyToken, hasRole, canAccess } from '@/lib/auth_jwt';
import { extractTokenFromHeader } from '@/lib/auth_jwt';
import { UserRole } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

    // Authorization - HR_SPECIALIST and above
    if (!canAccess(decoded.role, 3)) {
      return res.status(403).json({ error: 'Insufficient permissions for job creation' });
    }

    const {
      jobCode,
      jobTitle,
      department,
      jobLevel,
      jobFamily,
      evaluationCriteria,
    } = req.body;

    // Validation
    if (!jobCode || !jobTitle || !department || !jobLevel || !jobFamily) {
      return res.status(400).json({
        error: 'Missing required fields: jobCode, jobTitle, department, jobLevel, jobFamily',
      });
    }

    if (!Array.isArray(evaluationCriteria) || evaluationCriteria.length === 0) {
      return res.status(400).json({
        error: 'evaluationCriteria must be a non-empty array',
      });
    }

    // Verify evaluation criteria have required fields and weights sum to 100
    let totalWeight = 0;
    for (const criterion of evaluationCriteria) {
      if (!criterion.name || criterion.weight === undefined) {
        return res.status(400).json({
          error: 'Each evaluation criterion must have name and weight',
        });
      }
      totalWeight += criterion.weight;
    }

    if (Math.abs(totalWeight - 100) > 0.01) {
      return res.status(400).json({
        error: 'Evaluation criteria weights must sum to 100%',
      });
    }

    // Insert job evaluation record
    const result = await query(
      `INSERT INTO job_evaluations
       (job_code, job_title, department, job_level, job_family, evaluation_criteria, created_by, created_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 'DRAFT')
       RETURNING id, job_code, job_title, status, created_at`,
      [
        jobCode,
        jobTitle,
        department,
        jobLevel,
        jobFamily,
        JSON.stringify(evaluationCriteria),
        decoded.userId,
      ]
    );

    const jobEvaluation = result.rows[0];

    // Audit log
    await query(
      `INSERT INTO audit_logs
       (entity_type, entity_id, action, user_id_hash, details, timestamp)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        'JOB_EVALUATION',
        jobEvaluation.id,
        'CREATE',
        decoded.userId, // In production, pseudonymize this
        JSON.stringify({
          jobCode,
          jobTitle,
          department,
          criteria_count: evaluationCriteria.length,
        }),
      ]
    );

    return res.status(201).json({
      success: true,
      jobEvaluation: {
        id: jobEvaluation.id,
        jobCode: jobEvaluation.job_code,
        jobTitle: jobEvaluation.job_title,
        status: jobEvaluation.status,
        createdAt: jobEvaluation.created_at,
      },
    });
  } catch (error) {
    console.error('Job creation error:', error);
    return res.status(500).json({
      error: 'Failed to create job evaluation',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    });
  }
}
