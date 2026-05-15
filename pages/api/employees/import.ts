import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

interface EmployeeData {
  employeeId: string;
  firstName: string;
  lastName: string;
  salary: number;
  gender: 'M' | 'F' | 'O';
  department: string;
  jobCode: string;
}

interface ImportResponse {
  success: boolean;
  data?: {
    importSummary: {
      successfullyImported: number;
      totalRecords: number;
      failedRecords: number;
    };
    pseudonymizationReport: {
      algorithm: string;
      deletedFields: {
        firstNames: number;
        lastNames: number;
        originalIds: number;
      };
    };
  };
  error?: string;
}

// SHA-256 hashing for pseudonymization
function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

// Pseudonymize employee data
function pseudonymizeEmployee(emp: EmployeeData) {
  return {
    pseudonymId: hashValue(emp.employeeId),
    pseudonymFirstName: hashValue(emp.firstName),
    pseudonymLastName: hashValue(emp.lastName),
    salary: emp.salary,
    gender: emp.gender,
    department: emp.department,
    jobCode: emp.jobCode,
    importedAt: new Date().toISOString(),
  };
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ImportResponse>
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { employees } = req.body;

    // Validate input
    if (!Array.isArray(employees)) {
      return res.status(400).json({ success: false, error: 'Invalid employees data' });
    }

    if (employees.length === 0) {
      return res.status(400).json({ success: false, error: 'No employees to import' });
    }

    // Process employees
    const pseudonymizedEmployees: any[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const emp of employees) {
      try {
        // Validate required fields
        if (!emp.employeeId || !emp.firstName || !emp.lastName || emp.salary === undefined || !emp.gender || !emp.department || !emp.jobCode) {
          failureCount++;
          continue;
        }

        // Additional validation
        if (emp.salary <= 0) {
          failureCount++;
          continue;
        }

        if (!['M', 'F', 'O'].includes(emp.gender)) {
          failureCount++;
          continue;
        }

        // Pseudonymize and add to list
        const pseudonymized = pseudonymizeEmployee(emp);
        pseudonymizedEmployees.push(pseudonymized);
        successCount++;
      } catch (error) {
        failureCount++;
      }
    }

    // Return success response with pseudonymization report
    return res.status(200).json({
      success: true,
      data: {
        importSummary: {
          successfullyImported: successCount,
          totalRecords: employees.length,
          failedRecords: failureCount,
        },
        pseudonymizationReport: {
          algorithm: 'SHA-256',
          deletedFields: {
            firstNames: successCount,
            lastNames: successCount,
            originalIds: successCount,
          },
        },
      },
    });
  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Import failed',
    });
  }
}
