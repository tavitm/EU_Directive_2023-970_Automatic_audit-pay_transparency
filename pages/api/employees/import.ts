import { NextApiRequest, NextApiResponse } from 'next';
import { query, transaction } from '@/lib/db_client';
import { verifyToken, canAccess } from '@/lib/auth_jwt';
import { extractTokenFromHeader } from '@/lib/auth_jwt';
import {
  generatePseudonymHash,
  hashSalaryData,
  createPseudonymizationReport,
} from '@/lib/pseudonymization_hash';

/**
 * Bulk import employee salary data with IRREVERSIBLE pseudonymization
 * Directive 2023/970 Article 2 + GDPR Article 4(11) - Pseudonymisation
 *
 * This endpoint:
 * 1. Accepts employee data (firstName, lastName, employeeId, salary, gender, department, jobCode)
 * 2. Generates irreversible SHA-256 pseudonym hashes
 * 3. PERMANENTLY DELETES identifiable fields (firstName, lastName, originalEmployeeId)
 * 4. Stores only: pseudonymHash, salary, gender, department, jobCode
 *
 * Cannot be reversed - complies with GDPR pseudonymization requirements
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

    // Authorization - HR_SPECIALIST (level 3) and above
    if (!canAccess(decoded.role, 3)) {
      return res.status(403).json({
        error: 'Insufficient permissions for employee data import',
      });
    }

    const { employees } = req.body;

    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({
        error: 'employees must be a non-empty array',
      });
    }

    // Validate all records before processing
    for (const emp of employees) {
      if (!emp.employeeId || !emp.salary || !emp.gender || !emp.department || !emp.jobCode) {
        return res.status(400).json({
          error:
            'Each employee record must have: employeeId, salary, gender, department, jobCode',
        });
      }

      if (!['M', 'F', 'O'].includes(emp.gender)) {
        return res.status(400).json({
          error: "gender must be one of: 'M', 'F', 'O'",
        });
      }

      if (typeof emp.salary !== 'number' || emp.salary <= 0) {
        return res.status(400).json({
          error: 'salary must be a positive number',
        });
      }
    }

    // Execute in transaction
    const result = await transaction(async (client) => {
      let successCount = 0;
      let failCount = 0;

      for (const emp of employees) {
        try {
          // Generate irreversible pseudonym hash
          const pseudonymHash = generatePseudonymHash(emp.employeeId);

          // Hash the salary for additional security
          const salaryHash = hashSalaryData(emp.salary, emp.employeeId);

          // Insert employee with pseudonymized data only
          // firstName, lastName, originalEmployeeId are NOT stored
          await client.query(
            `INSERT INTO employees_pseudonymous
             (pseudonym_hash, salary, salary_hash, gender, department, job_code, imported_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [pseudonymHash, emp.salary, salaryHash, emp.gender, emp.department, emp.jobCode]
          );

          successCount++;
        } catch (error) {
          console.error(`Failed to import employee ${emp.employeeId}:`, error);
          failCount++;
        }
      }

      // Create pseudonymization report
      const report = createPseudonymizationReport(
        employees.length,
        successCount,
        failCount
      );

      // Store report for audit
      await client.query(
        `INSERT INTO pseudonymization_reports
         (total_records, successful, failed, deleted_fields, algorithm, salt_hash, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          report.originalRecords,
          report.successfullyPseudonymized,
          report.failedRecords,
          JSON.stringify(report.deletedFields),
          report.algorithm,
          report.salt,
        ]
      );

      // Audit log
      await client.query(
        `INSERT INTO audit_logs
         (entity_type, entity_id, action, user_id_hash, details, timestamp)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          'EMPLOYEE_IMPORT',
          'BULK',
          'IMPORT_WITH_PSEUDONYMIZATION',
          decoded.userId,
          JSON.stringify({
            total_records: employees.length,
            successful: successCount,
            failed: failCount,
            algorithm: 'SHA-256',
            irreversible: true,
          }),
        ]
      );

      return { successCount, failCount, report };
    });

    return res.status(201).json({
      success: true,
      importSummary: {
        totalRecords: employees.length,
        successfullyImported: result.successCount,
        failedRecords: result.failCount,
        message: `${result.successCount} employees imported with IRREVERSIBLE pseudonymization. ${result.failCount} records failed.`,
      },
      pseudonymizationReport: {
        algorithm: result.report.algorithm,
        deletedFields: result.report.deletedFields,
        timestamp: result.report.timestamp,
        note: 'Original employee IDs, first names, and last names have been permanently deleted and cannot be recovered.',
      },
    });
  } catch (error) {
    console.error('Employee import error:', error);
    return res.status(500).json({
      error: 'Failed to import employees',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    });
  }
}
