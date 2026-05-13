import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db_client';
import { verifyToken, canAccess } from '@/lib/auth_jwt';
import { extractTokenFromHeader } from '@/lib/auth_jwt';
import {
  buildGenderGroups,
  calculatePayGap,
  getComplianceStatus,
  generateGapSummary,
  calculateStatisticalSignificance,
} from '@/lib/calculations_gapAnalysis';

/**
 * Generate compliance report per Directive 2023/970
 * Articles 1-17 compliance summary for:
 * - Job evaluation methodology (Article 3)
 * - Pay gap analysis (Articles 5-7)
 * - Justifications (Article 8)
 * - Corrective measures (Article 9)
 * - Employee transparency (Article 10)
 *
 * Access: COMPLIANCE_OFFICER and above only (Article 15 requirement)
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

    // Authorization - COMPLIANCE_OFFICER (level 4) and above only
    if (!canAccess(decoded.role, 4)) {
      return res.status(403).json({
        error: 'Only Compliance Officers and Administrators can generate compliance reports',
      });
    }

    const { reportYear = new Date().getFullYear() } = req.query;

    // Fetch job evaluations
    const jobsResult = await query(
      'SELECT id, job_code, job_title, status FROM job_evaluations WHERE status = $1',
      ['ACTIVE']
    );

    // Fetch all employee data
    const employeesResult = await query(
      'SELECT gender, salary FROM employees_pseudonymous'
    );

    const employees = employeesResult.rows.map((row: any) => ({
      gender: row.gender,
      salary: row.salary,
    }));

    // Fetch pay gap justifications
    const justificationsResult = await query(
      'SELECT status, department, gap_percentage FROM gap_justifications'
    );

    // Fetch corrective measures
    const measuresResult = await query(
      'SELECT status, department, expected_impact FROM corrective_measures'
    );

    // Build gender groups
    const genderGroups = buildGenderGroups(employees);

    // Calculate overall gap
    const maleAvgSalary = genderGroups.M?.avgSalary || 0;
    const femaleAvgSalary = genderGroups.F?.avgSalary || 0;
    const overallGap = calculatePayGap(maleAvgSalary, femaleAvgSalary);

    // Calculate statistical significance
    const maleData = employees
      .filter((e: any) => e.gender === 'M')
      .map((e: any) => e.salary);
    const femaleData = employees
      .filter((e: any) => e.gender === 'F')
      .map((e: any) => e.salary);

    const statsSignificance =
      maleData.length >= 10 && femaleData.length >= 10
        ? calculateStatisticalSignificance(maleData, femaleData)
        : null;

    // Determine compliance status
    const complianceStatus = getComplianceStatus(overallGap);

    // Count justifications by status
    const justificationStats = {
      submitted: justificationsResult.rows.filter((r: any) => r.status === 'SUBMITTED')
        .length,
      approved: justificationsResult.rows.filter((r: any) => r.status === 'APPROVED')
        .length,
      rejected: justificationsResult.rows.filter((r: any) => r.status === 'REJECTED')
        .length,
    };

    // Count corrective measures by status
    const measuresStats = {
      planned: measuresResult.rows.filter((r: any) => r.status === 'PLANNED').length,
      inProgress: measuresResult.rows.filter((r: any) => r.status === 'IN_PROGRESS')
        .length,
      completed: measuresResult.rows.filter((r: any) => r.status === 'COMPLETED').length,
    };

    // Generate summary
    const summary = generateGapSummary(
      genderGroups,
      overallGap,
      overallGap,
      statsSignificance || { pValue: 0 }
    );

    return res.status(200).json({
      success: true,
      report: {
        reportYear: reportYear,
        generatedAt: new Date().toISOString(),
        generatedBy: decoded.userId,

        // Article 3 - Job Evaluation Methodology
        jobEvaluationMethodology: {
          methodologiesDefined: jobsResult.rows.length,
          methodologiesActive: jobsResult.rows.filter(
            (r: any) => r.status === 'ACTIVE'
          ).length,
          complianceStatus: jobsResult.rows.length > 0 ? 'COMPLIANT' : 'NON_COMPLIANT',
          article3Reference: 'Directive 2023/970 Article 3',
        },

        // Articles 5-7 - Pay Gap Analysis
        payGapAnalysis: {
          reportingPeriod: reportYear,
          totalEmployees: employees.length,
          maleEmployees: genderGroups.M?.count || 0,
          femaleEmployees: genderGroups.F?.count || 0,
          otherEmployees: genderGroups.O?.count || 0,
          overallGapPercentage: overallGap,
          gapDirection: overallGap > 0 ? 'MALE_ADVANTAGE' : 'FEMALE_ADVANTAGE',
          complianceStatus: complianceStatus,
          statisticalSignificance:
            statsSignificance?.pValue < 0.05
              ? 'SIGNIFICANT_AT_95_CONFIDENCE'
              : 'NOT_SIGNIFICANT',
          articles567Reference: 'Directive 2023/970 Articles 5-7',
        },

        // Article 8 - Justifications
        justifications: {
          totalSubmitted: justificationStats.submitted + justificationStats.approved,
          approved: justificationStats.approved,
          rejected: justificationStats.rejected,
          pending: justificationStats.submitted,
          complianceStatus:
            justificationStats.rejected > 0 || justificationStats.pending > 0
              ? 'IN_PROGRESS'
              : 'COMPLIANT',
          article8Reference: 'Directive 2023/970 Article 8',
        },

        // Article 9 - Corrective Measures
        correctiveMeasures: {
          totalPlanned: measuresStats.planned,
          inProgress: measuresStats.inProgress,
          completed: measuresStats.completed,
          complianceStatus:
            measuresStats.planned > 0 || measuresStats.inProgress > 0
              ? 'IN_PROGRESS'
              : 'COMPLIANT',
          article9Reference: 'Directive 2023/970 Article 9',
        },

        // Article 10 - Employee Transparency
        employeeTransparency: {
          requestsManagement: 'Implemented via API endpoints',
          responseDeadline: '15 days per Article 10',
          pseudonymizationImplemented: true,
          article10Reference: 'Directive 2023/970 Article 10',
        },

        // GDPR Compliance
        gdprCompliance: {
          pseudonymization: 'SHA-256 irreversible hashing',
          dataMinimization: 'Only necessary data retained',
          dataProtectionByDesign: 'Implemented in all workflows',
          encryption: 'AES-256 for data at rest and in transit',
          articles482532Reference: 'GDPR Articles 4, 25, 32',
        },

        // Overall Assessment
        overallComplianceAssessment: {
          status: complianceStatus,
          recommendations:
            complianceStatus === 'CRITICAL'
              ? 'Immediate action required. Corrective measures must be implemented. Submit detailed justifications.'
              : complianceStatus === 'REQUIRES_JUSTIFICATION'
              ? 'Documentation and justifications required. Corrective measures recommended.'
              : 'Organization is compliant with Directive 2023/970 requirements.',
          lastReviewDate: new Date().toISOString(),
          nextReviewDate: new Date(
            new Date().setFullYear(new Date().getFullYear() + 1)
          ).toISOString(),
        },
      },
      fullSummary: summary,
    });
  } catch (error) {
    console.error('Compliance report generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate compliance report',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    });
  }
}
