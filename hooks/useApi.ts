import { useAuth } from '@/pages/_app';
import { useState, useCallback } from 'react';

interface ApiError {
  message: string;
  details?: string;
  statusCode?: number;
}

interface UseApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

export function useApi<T = any>() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<T | null>(null);

  const request = useCallback(
    async (endpoint: string, options: UseApiOptions = {}): Promise<T | null> => {
      setLoading(true);
      setError(null);
      // Mock delay for realistic UX
      await new Promise(resolve => setTimeout(resolve, 300));

      try {
        // Return mock data instead of calling API
        const responseData = { success: true, data: {} };
        setData(responseData as any);
        return responseData as any;
      } catch (err: any) {
        const apiError: ApiError = {
          message: err.message || 'An error occurred',
          details: err.details,
          statusCode: err.statusCode,
        };
        setError(apiError);
        console.error('Mock API Error:', apiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  return { data, loading, error, request };
}

/* Specialized Hooks - Return Mock Data */

export function useJobs() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const error: ApiError | null = null;

  const createJob = async (jobData: any) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    const result = { success: true, jobId: `JOB-${Date.now()}` };
    setData(result);
    setLoading(false);
    return result;
  };

  const listJobs = async (filters?: any) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    const result = {
      jobs: [
        {
          id: 'JOB-001',
          code: 'ENG-001',
          title: 'Senior Engineer',
          department: 'Engineering',
          evaluationScore: 85,
          status: 'ACTIVE'
        }
      ]
    };
    setData(result);
    setLoading(false);
    return result;
  };

  const activateJob = async (jobId: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    const result = { success: true };
    setData(result);
    setLoading(false);
    return result;
  };

  return { createJob, listJobs, activateJob, loading, error, data };
}

export function useEmployees() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const error: ApiError | null = null;

  const importEmployees = async (employees: any[]) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const result = { success: true, imported: employees.length };
    setData(result);
    setLoading(false);
    return result;
  };

  const requestTransparency = async (jobCode: string, department: string, gender?: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    const result = {
      requestId: `TRANS-${Date.now()}`,
      peerGroup: {
        jobCode,
        department,
        gender,
        count: 12,
        salaryStats: {
          minimum: 50000,
          p25: 55000,
          median: 62500,
          p75: 70000,
          maximum: 75000,
          mean: 62500,
          stdDev: 8200
        }
      },
      responseDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      requestStatus: 'COMPLETED' as const
    };
    setData(result);
    setLoading(false);
    return result;
  };

  return { importEmployees, requestTransparency, loading, error, data };
}

export function useAnalysis() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const error: ApiError | null = null;

  const calculateGap = async (filters?: any) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const result = {
      analysis: {
        gapAnalysis: {
          adjustedGap: 6.2,
          unadjustedGap: 8.5
        },
        statisticalSignificance: {
          tStatistic: 2.145,
          pValue: 0.035,
          significantAt95Confidence: true,
          sampleSize: 450
        },
        employeeData: {
          total: 450,
          maleCount: 280,
          femaleCount: 170,
          otherCount: 0,
          maleAvgSalary: 72500,
          femaleAvgSalary: 66400,
          otherAvgSalary: 0
        },
        byDepartment: [
          { department: 'Engineering', gap: 12.3, maleCount: 150, femaleCount: 60, maleAvgSalary: 85000, femaleAvgSalary: 74600 },
          { department: 'Sales', gap: 5.2, maleCount: 80, femaleCount: 70, maleAvgSalary: 68000, femaleAvgSalary: 64600 },
          { department: 'HR', gap: 3.1, maleCount: 20, femaleCount: 25, maleAvgSalary: 55000, femaleAvgSalary: 53300 }
        ],
        byJobCode: [
          { jobCode: 'SR-ENG', gap: 15.2, maleCount: 80, femaleCount: 20, maleAvgSalary: 95000, femaleAvgSalary: 80600 },
          { jobCode: 'JR-ENG', gap: 8.5, maleCount: 70, femaleCount: 40, maleAvgSalary: 65000, femaleAvgSalary: 59600 }
        ],
        byTenure: [
          { tenureRange: '0-2', gap: 5.1, employeeCount: 120 },
          { tenureRange: '2-5', gap: 8.3, employeeCount: 200 },
          { tenureRange: '5+', gap: 12.1, employeeCount: 130 }
        ]
      },
      complianceStatus: 'REQUIRES_JUSTIFICATION',
      recommendations: [
        'Implement mentorship program for female employees in engineering',
        'Review promotion criteria for potential gender bias',
        'Conduct salary audit for senior positions'
      ]
    } as any;
    setData(result);
    setLoading(false);
    return result;
  };

  return { calculateGap, loading, error, data };
}

export function useJustifications() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const error: ApiError | null = null;

  const submitJustification = async (justificationData: any) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 400));
    const result = { success: true, justificationId: `JUST-${Date.now()}` };
    setData(result);
    setLoading(false);
    return result;
  };

  const approveJustification = async (justificationId: string, approvalStatus: string, comments?: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    const result = { success: true };
    setData(result);
    setLoading(false);
    return result;
  };

  return { submitJustification, approveJustification, loading, error, data };
}

export function useAudit() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const error: ApiError | null = null;

  const getLogs = async (filters?: any) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    const result = {
      logs: [
        {
          id: 'LOG-001',
          action: 'LOGIN',
          user: 'user@example.com',
          timestamp: new Date().toISOString(),
          details: 'User logged in'
        }
      ]
    };
    setData(result);
    setLoading(false);
    return result;
  };

  return { getLogs, loading, error, data };
}

export function useReports() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const error: ApiError | null = null;

  const getComplianceReport = async (reportYear?: number) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const result = {
      year: reportYear || new Date().getFullYear(),
      articles: {
        article3: { status: 'COMPLIANT', details: 'Job evaluation implemented' },
        article4: { status: 'COMPLIANT', details: 'Pay gap analysis completed' },
        article8: { status: 'PARTIAL', details: 'Justifications submitted: 3' },
        article10: { status: 'COMPLIANT', details: 'Employee transparency enabled' }
      }
    };
    setData(result);
    setLoading(false);
    return result;
  };

  return { getComplianceReport, loading, error, data };
}
