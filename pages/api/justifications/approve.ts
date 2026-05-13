import { NextApiRequest, NextApiResponse } from 'next';
import { query, transaction } from '@/lib/db_client';
import { verifyToken, canAccess } from '@/lib/auth_jwt';
import { extractTokenFromHeader } from '@/lib/auth_jwt';

/**
 * Approve or reject a pay gap justification
 * Directive 2023/970 Article 8 - Multi-stage approval workflow
 *
 * Approval stages:
 * 1. HR_SPECIALIST: Reviews for completeness and supporting evidence
 * 2. COMPLIANCE_OFFICER: Final approval for Directive compliance
 *
 * Only the assigned role can approve at each stage
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

    const { justificationId, approvalStatus, comments } = req.body;

    // Validation
    if (!justificationId || !approvalStatus) {
      return res.status(400).json({
        error: 'Missing required fields: justificationId, approvalStatus',
      });
    }

    if (!['APPROVED', 'REJECTED'].includes(approvalStatus)) {
      return res.status(400).json({
        error: "approvalStatus must be 'APPROVED' or 'REJECTED'",
      });
    }

    // Fetch justification and check current stage
    const justResult = await query(
      `SELECT id, status, approval_stage FROM gap_justifications WHERE id = $1`,
      [justificationId]
    );

    if (justResult.rows.length === 0) {
      return res.status(404).json({ error: 'Justification not found' });
    }

    const justification = justResult.rows[0];

    // Determine current approval stage and required role
    let requiredLevel: number;
    let currentStage: string;

    if (justification.approval_stage === 'MANAGER_SUBMITTED') {
      requiredLevel = 3; // HR_SPECIALIST
      currentStage = 'HR_SPECIALIST';
    } else if (justification.approval_stage === 'HR_REVIEWED') {
      requiredLevel = 4; // COMPLIANCE_OFFICER
      currentStage = 'COMPLIANCE_OFFICER';
    } else {
      return res.status(400).json({
        error: `Justification with status ${justification.status} cannot be approved further`,
      });
    }

    // Authorization check
    if (!canAccess(decoded.role, requiredLevel)) {
      return res.status(403).json({
        error: `Only ${currentStage} can approve at this stage`,
      });
    }

    // Execute in transaction
    const result = await transaction(async (client) => {
      if (approvalStatus === 'APPROVED') {
        // Move to next stage
        let newStage: string;
        let newStatus: string;

        if (currentStage === 'HR_SPECIALIST') {
          newStage = 'HR_REVIEWED';
          newStatus = 'UNDER_REVIEW'; // Still pending Compliance Officer
        } else if (currentStage === 'COMPLIANCE_OFFICER') {
          newStage = 'COMPLIANCE_APPROVED';
          newStatus = 'APPROVED'; // Final approval
        } else {
          throw new Error('Invalid approval stage');
        }

        await client.query(
          `UPDATE gap_justifications
           SET approval_stage = $1, status = $2, last_reviewed_at = NOW()
           WHERE id = $3`,
          [newStage, newStatus, justificationId]
        );
      } else {
        // Rejection - justification must be resubmitted
        await client.query(
          `UPDATE gap_justifications
           SET status = 'REJECTED', approval_stage = 'REJECTED', last_reviewed_at = NOW()
           WHERE id = $1`,
          [justificationId]
        );
      }

      // Record approval/rejection
      await client.query(
        `INSERT INTO justification_approvals
         (justification_id, approver_role, approval_status, reviewer_user_id, review_comments, review_date)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          justificationId,
          currentStage,
          approvalStatus,
          decoded.userId,
          comments || null,
        ]
      );

      // Audit log
      await client.query(
        `INSERT INTO audit_logs
         (entity_type, entity_id, action, user_id_hash, details, timestamp)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          'GAP_JUSTIFICATION',
          justificationId,
          `JUSTIFICATION_${approvalStatus}`,
          decoded.userId,
          JSON.stringify({
            approval_stage: currentStage,
            decision: approvalStatus,
            has_comments: !!comments,
            article_8_reference: 'Directive 2023/970',
          }),
        ]
      );

      return newStatus;
    });

    return res.status(200).json({
      success: true,
      justification: {
        id: justificationId,
        status: approvalStatus === 'APPROVED' ? 'UNDER_REVIEW' : 'REJECTED',
        currentApprovalStage:
          approvalStatus === 'APPROVED'
            ? currentStage === 'HR_SPECIALIST'
              ? 'PENDING_COMPLIANCE_OFFICER'
              : 'APPROVED'
            : 'REJECTED',
        reviewedBy: decoded.userId,
        reviewedAt: new Date().toISOString(),
      },
      nextStep:
        approvalStatus === 'APPROVED'
          ? currentStage === 'HR_SPECIALIST'
            ? 'Waiting for Compliance Officer final approval'
            : 'Justification approved. Corrective measures can be implemented.'
          : 'Justification rejected. Submitter must revise and resubmit.',
    });
  } catch (error) {
    console.error('Justification approval error:', error);
    return res.status(500).json({
      error: 'Failed to process approval',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    });
  }
}
