import { NextApiRequest, NextApiResponse } from 'next';
import { query, transaction } from '@/lib/db_client';
import { verifyToken, canAccess } from '@/lib/auth_jwt';
import { extractTokenFromHeader } from '@/lib/auth_jwt';

/**
 * Submit a pay gap justification for approval
 * Directive 2023/970 Article 8 - Member States shall take measures to ensure justification of pay gaps
 *
 * Multi-stage approval workflow:
 * 1. Manager/HR_SPECIALIST submits justification (status: SUBMITTED)
 * 2. HR_SPECIALIST reviews (status: HR_REVIEWED)
 * 3. COMPLIANCE_OFFICER approves (status: APPROVED) or rejects (status: REJECTED)
 *
 * Once approved, corrective measures can be implemented
 */
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

    // Authorization - MANAGER (level 2) and above can submit
    if (!canAccess(decoded.role, 2)) {
      return res.status(403).json({
        error: 'Insufficient permissions to submit justification',
      });
    }

    const {
      gapAnalysisId,
      department,
      jobCode,
      gapPercentage,
      justificationReason,
      supportingDocuments,
      proposedMeasures,
      implementationTimeline,
    } = req.body;

    // Validation
    if (
      !gapAnalysisId ||
      !department ||
      !jobCode ||
      gapPercentage === undefined ||
      !justificationReason ||
      !proposedMeasures
    ) {
      return res.status(400).json({
        error:
          'Missing required fields: gapAnalysisId, department, jobCode, gapPercentage, justificationReason, proposedMeasures',
      });
    }

    if (justificationReason.trim().length < 50) {
      return res.status(400).json({
        error: 'Justification reason must be at least 50 characters',
      });
    }

    if (!Array.isArray(proposedMeasures) || proposedMeasures.length === 0) {
      return res.status(400).json({
        error: 'At least one proposed corrective measure is required',
      });
    }

    // Execute in transaction
    const result = await transaction(async (client) => {
      // Create justification record
      const justificationResult = await client.query(
        `INSERT INTO gap_justifications
         (gap_analysis_id, department, job_code, gap_percentage, justification_reason,
          supporting_documents, proposed_measures, implementation_timeline,
          submitted_by, submitted_at, status, approval_stage)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), 'SUBMITTED', 'MANAGER_SUBMITTED')
         RETURNING id, submitted_at`,
        [
          gapAnalysisId,
          department,
          jobCode,
          gapPercentage,
          justificationReason,
          JSON.stringify(supportingDocuments || []),
          JSON.stringify(proposedMeasures),
          implementationTimeline || null,
          decoded.userId,
        ]
      );

      const justification = justificationResult.rows[0];

      // Create approval workflow records
      // HR_SPECIALIST must review first
      await client.query(
        `INSERT INTO justification_approvals
         (justification_id, approver_role, approval_status, approval_order)
         VALUES ($1, 'HR_SPECIALIST', 'PENDING', 1)`,
        [justification.id]
      );

      // Then COMPLIANCE_OFFICER final approval
      await client.query(
        `INSERT INTO justification_approvals
         (justification_id, approver_role, approval_status, approval_order)
         VALUES ($1, 'COMPLIANCE_OFFICER', 'PENDING', 2)`,
        [justification.id]
      );

      // Audit log
      await client.query(
        `INSERT INTO audit_logs
         (entity_type, entity_id, action, user_id_hash, details, timestamp)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          'GAP_JUSTIFICATION',
          justification.id,
          'SUBMIT',
          decoded.userId,
          JSON.stringify({
            gap_percentage: gapPercentage,
            department,
            job_code: jobCode,
            proposed_measures_count: proposedMeasures.length,
            article_8_reference: 'Directive 2023/970',
          }),
        ]
      );

      return justification;
    });

    return res.status(201).json({
      success: true,
      justification: {
        id: result.id,
        status: 'SUBMITTED',
        nextApprovalStage: 'HR_SPECIALIST',
        submittedAt: result.submitted_at,
        message:
          'Justification submitted successfully. HR Specialist will review and forward to Compliance Officer for final approval.',
      },
      approvalWorkflow: [
        {
          stage: 1,
          role: 'HR_SPECIALIST',
          status: 'PENDING',
          description: 'Review for completeness and evidence',
        },
        {
          stage: 2,
          role: 'COMPLIANCE_OFFICER',
          status: 'PENDING',
          description: 'Final approval per Directive 2023/970 Article 8',
        },
      ],
    });
  } catch (error) {
    console.error('Justification submission error:', error);
    return res.status(500).json({
      error: 'Failed to submit justification',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    });
  }
}
