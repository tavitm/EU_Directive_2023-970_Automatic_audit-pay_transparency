import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db_client';
import { verifyToken, canAccess } from '@/lib/auth_jwt';
import { extractTokenFromHeader } from '@/lib/auth_jwt';

/**
 * Retrieve immutable audit logs
 * GDPR Articles 5 (transparency), 32 (security), Directive 2023/970 Article 15
 *
 * Audit trail is append-only and includes:
 * - All job evaluation changes (create, activate)
 * - Employee data imports (with pseudonymization details)
 * - Gap analysis calculations
 * - Justification submissions and approvals
 * - Corrective measure implementations
 *
 * Access control:
 * - COMPLIANCE_OFFICER+: Can see all audit logs
 * - HR_SPECIALIST: Can see logs for own submissions
 * - MANAGER/EMPLOYEE: Limited visibility to own actions
 */
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

    // Query parameters
    const {
      entityType,
      action,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = req.query;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    // Access control - COMPLIANCE_OFFICER and above can see all logs
    if (!canAccess(decoded.role, 4)) {
      // Limited to own actions for lower roles
      whereClause += ` AND user_id_hash = $${paramCount}`;
      params.push(decoded.userId);
      paramCount++;
    }

    // Apply filters
    if (entityType) {
      whereClause += ` AND entity_type = $${paramCount}`;
      params.push(entityType);
      paramCount++;
    }

    if (action) {
      whereClause += ` AND action = $${paramCount}`;
      params.push(action);
      paramCount++;
    }

    if (startDate) {
      whereClause += ` AND timestamp >= $${paramCount}::timestamp`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      whereClause += ` AND timestamp <= $${paramCount}::timestamp`;
      params.push(endDate);
      paramCount++;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated logs
    const listParams = [
      ...params,
      parseInt(String(limit), 10),
      parseInt(String(offset), 10),
    ];
    const result = await query(
      `SELECT id, entity_type, entity_id, action, user_id_hash, details, timestamp
       FROM audit_logs
       ${whereClause}
       ORDER BY timestamp DESC
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
      auditLogs: result.rows.map((row: any) => ({
        id: row.id,
        entityType: row.entity_type,
        entityId: row.entity_id,
        action: row.action,
        userIdHash: row.user_id_hash,
        details: JSON.parse(row.details || '{}'),
        timestamp: row.timestamp,
      })),
      complianceNotes: {
        immutableTrail: 'All entries are append-only and cannot be modified or deleted',
        gdprCompliant: 'User IDs are pseudonymized per GDPR Article 4(11)',
        directive2023_970: 'Article 15 requires audit trail of all processes',
      },
    });
  } catch (error) {
    console.error('Audit log retrieval error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve audit logs',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    });
  }
}
