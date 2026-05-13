import { GenderGroup, GapAnalysisResult } from '@/types';

/**
 * Calculate gender-based pay gap using standardized formula
 * Directive 2023/970, Article 7
 * Formula: ((avg_salary_male - avg_salary_female) / avg_salary_female) × 100
 */
export function calculatePayGap(
  maleAvgSalary: number,
  femaleAvgSalary: number
): number {
  if (femaleAvgSalary === 0) return 0;

  const gap = ((maleAvgSalary - femaleAvgSalary) / femaleAvgSalary) * 100;
  return parseFloat(gap.toFixed(2));
}

/**
 * Perform statistical significance test (t-test)
 * Returns p-value to assess if gap is statistically significant
 */
export function calculateStatisticalSignificance(
  maleData: number[],
  femaleData: number[]
): { tStatistic: number; pValue: number } {
  // Calculate means
  const maleMean = maleData.reduce((a, b) => a + b) / maleData.length;
  const femaleMean = femaleData.reduce((a, b) => a + b) / femaleData.length;

  // Calculate variances
  const maleVariance =
    maleData.reduce((sum, val) => sum + Math.pow(val - maleMean, 2), 0) /
    (maleData.length - 1);
  const femaleVariance =
    femaleData.reduce((sum, val) => sum + Math.pow(val - femaleMean, 2), 0) /
    (femaleData.length - 1);

  // Calculate pooled standard error
  const pooledStdError = Math.sqrt(
    maleVariance / maleData.length + femaleVariance / femaleData.length
  );

  // Calculate t-statistic
  const tStatistic = (maleMean - femaleMean) / pooledStdError;

  // Approximate p-value (simplified)
  // In production, use proper statistical library
  const pValue = 1 / (1 + Math.exp(-Math.abs(tStatistic)));

  return {
    tStatistic: parseFloat(tStatistic.toFixed(4)),
    pValue: parseFloat(pValue.toFixed(4)),
  };
}

/**
 * Build gender groups from employee salary data
 */
export function buildGenderGroups(
  employees: Array<{ gender: string; salary: number }>
): Record<string, GenderGroup> {
  const groups: Record<string, { salaries: number[]; count: number }> = {
    M: { salaries: [], count: 0 },
    F: { salaries: [], count: 0 },
    O: { salaries: [], count: 0 },
  };

  employees.forEach(({ gender, salary }) => {
    if (groups[gender]) {
      groups[gender].salaries.push(salary);
      groups[gender].count++;
    }
  });

  const result: Record<string, GenderGroup> = {};

  Object.entries(groups).forEach(([gender, data]) => {
    if (data.count > 0) {
      const avgSalary =
        data.salaries.reduce((a, b) => a + b, 0) / data.count;
      result[gender] = {
        count: data.count,
        avgSalary: parseFloat(avgSalary.toFixed(2)),
      };
    }
  });

  return result;
}

/**
 * Validate gap analysis parameters
 */
export function validateGapAnalysisParams(params: {
  minGroupSize: number;
  maleCount: number;
  femaleCount: number;
  jobEvalAdjustment?: boolean;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (params.minGroupSize < 1) {
    errors.push('Minimum group size must be at least 1');
  }

  if (params.maleCount < params.minGroupSize) {
    errors.push(
      `Insufficient male employees (need ${params.minGroupSize}, have ${params.maleCount})`
    );
  }

  if (params.femaleCount < params.minGroupSize) {
    errors.push(
      `Insufficient female employees (need ${params.minGroupSize}, have ${params.femaleCount})`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Adjust gap for job evaluation differences
 * Controls for job complexity variations between genders
 */
export function adjustGapForJobEvaluation(
  rawGap: number,
  maleAvgJobScore: number,
  femaleAvgJobScore: number
): number {
  if (maleAvgJobScore === femaleAvgJobScore) {
    return rawGap;
  }

  // Adjustment factor based on job evaluation score difference
  const scoreDifference = maleAvgJobScore - femaleAvgJobScore;
  const adjustmentFactor = scoreDifference * 0.15; // 0.15% adjustment per job score point

  const adjustedGap = rawGap - adjustmentFactor;
  return parseFloat(adjustedGap.toFixed(2));
}

/**
 * Determine compliance status based on gap analysis
 */
export function getComplianceStatus(
  gapPercentage: number
): 'COMPLIANT' | 'REQUIRES_JUSTIFICATION' | 'CRITICAL' {
  if (Math.abs(gapPercentage) < 5) {
    return 'COMPLIANT';
  } else if (Math.abs(gapPercentage) < 10) {
    return 'REQUIRES_JUSTIFICATION';
  } else {
    return 'CRITICAL';
  }
}

/**
 * Format gap analysis result for reporting
 */
export function formatGapResult(
  gapPercentage: number,
  direction: 'MALE_ADVANTAGE' | 'FEMALE_ADVANTAGE' | 'NO_GAP'
): string {
  const absGap = Math.abs(gapPercentage);

  if (absGap < 0.1) {
    return 'No significant gap';
  }

  const directionText =
    direction === 'MALE_ADVANTAGE'
      ? 'Male employees earn'
      : 'Female employees earn';

  return `${directionText} ${absGap.toFixed(2)}% more on average`;
}

/**
 * Generate gap analysis summary
 */
export function generateGapSummary(
  genderGroups: Record<string, GenderGroup>,
  rawGap: number,
  adjustedGap: number,
  statisticalSignificance: { pValue: number }
): string {
  const summary = [
    '=== Pay Gap Analysis Summary ===',
    '',
    `Male employees: ${genderGroups.M?.count || 0} (avg: €${genderGroups.M?.avgSalary || 0})`,
    `Female employees: ${genderGroups.F?.count || 0} (avg: €${genderGroups.F?.avgSalary || 0})`,
    '',
    `Raw gap: ${rawGap.toFixed(2)}%`,
    `Adjusted gap (job eval controlled): ${adjustedGap.toFixed(2)}%`,
    `Statistical significance (p-value): ${statisticalSignificance.pValue.toFixed(4)}`,
    `Significant at 95% confidence: ${statisticalSignificance.pValue < 0.05 ? 'Yes' : 'No'}`,
  ];

  return summary.join('\n');
}
