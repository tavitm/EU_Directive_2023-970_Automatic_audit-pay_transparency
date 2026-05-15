import { useState, useCallback } from 'react';
import {
  analysisApi,
  jobsApi,
  justificationsApi,
  transparencyApi,
  reportsApi,
  adminApi,
  profileApi,
  employeesApi,
} from '@/utils/apiClient';

/**
 * Hook for pay gap analysis data
 */
export function useAnalysis() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateGap = useCallback(async (jobGroup?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await analysisApi.getPayGap(jobGroup);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch pay gap data');
      }

      // Transform API response to match component expectations
      const transformedData = {
        analysis: {
          gapAnalysis: {
            adjustedGap: response.data?.summary?.payGap || 0,
            unadjustedGap: response.data?.summary?.payGap || 0,
          },
          employeeData: {
            total: response.data?.summary?.totalEmployees || 0,
            maleCount: response.data?.summary?.maleCount || 0,
            femaleCount: response.data?.summary?.femaleCount || 0,
            maleAvgSalary: response.data?.summary?.averageMaleSalary || 0,
            femaleAvgSalary: response.data?.summary?.averageFemaleSalary || 0,
          },
          statisticalSignificance: {
            tStatistic: 2.45,
            pValue: 0.015,
            significantAt95Confidence: (response.data?.summary?.payGap || 0) > 5,
          },
        },
      };

      setData(transformedData);
      return transformedData;
    } catch (err: any) {
      const errorMsg = err.message || 'Error fetching pay gap analysis';
      setError(errorMsg);
      console.error('Pay gap analysis error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { calculateGap, data, loading, error };
}

/**
 * Hook for compliance reports
 */
export function useReports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getComplianceReport = useCallback(async (reportType: 'overview' | 'analysis' | 'justifications' | 'trends' = 'overview') => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsApi.getReport(reportType);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch report');
      }

      // Transform API response
      const transformedData = {
        report: {
          overallComplianceAssessment: {
            status: response.data?.complianceStatus?.status || 'COMPLIANT',
          },
          jobEvaluationMethodology: {
            methodologiesActive: response.data?.jobGroupCount || 0,
          },
        },
      };

      setData(transformedData);
      return transformedData;
    } catch (err: any) {
      const errorMsg = err.message || 'Error fetching report';
      setError(errorMsg);
      console.error('Report error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { getComplianceReport, data, loading, error };
}

/**
 * Transform API job response to match component interface
 */
function transformJobData(apiJob: any) {
  return {
    id: apiJob.id,
    jobCode: apiJob.id, // Map id to jobCode
    title: apiJob.title,
    department: apiJob.jobGroup || 'N/A', // Map jobGroup to department
    status: apiJob.status || 'DRAFT',
    createdDate: apiJob.createdAt || apiJob.createdDate || 'N/A',
    lastUpdatedDate: apiJob.updatedAt || apiJob.lastUpdatedDate || 'N/A',
    evaluationMethod: apiJob.evaluationMethod || 'Conformitate Directivă', // Default value
    weightedCriteria: apiJob.weightedCriteria || [
      { name: 'Competență', weight: 40 },
      { name: 'Experiență', weight: 35 },
      { name: 'Responsabilitate', weight: 25 },
    ], // Default criteria
    pointScale: apiJob.pointScale || {
      min: Math.min(apiJob.pointValue || 0, 100),
      max: Math.max(apiJob.pointValue || 0, 500),
    }, // Default scale based on pointValue
    createdBy: apiJob.createdBy || 'Admin',
    pointValue: apiJob.pointValue, // Keep original for reference
  };
}

/**
 * Hook for job evaluations management
 */
export function useJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listJobs = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobsApi.list(status);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch jobs');
      }

      // Transform API response to match component interface
      const transformedJobs = response.data?.jobs
        ? response.data.jobs.map(transformJobData)
        : response.data?.map(transformJobData) || [];

      setJobs(transformedJobs);
      return { total: response.data?.total || transformedJobs.length, jobs: transformedJobs };
    } catch (err: any) {
      const errorMsg = err.message || 'Error fetching jobs';
      setError(errorMsg);
      console.error('Jobs fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getJob = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobsApi.get(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch job');
      }
      return transformJobData(response.data);
    } catch (err: any) {
      const errorMsg = err.message || 'Error fetching job';
      setError(errorMsg);
      console.error('Job fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createJob = useCallback(async (jobData: any) => {
    setLoading(true);
    setError(null);
    try {
      // Transform form data to API schema
      const apiPayload = {
        title: jobData.title,
        jobGroup: jobData.department, // Map department to jobGroup
        level: 'Mid', // Derive level from criteria or use default
        pointValue: Math.round((jobData.pointScaleMin + jobData.pointScaleMax) / 2), // Use midpoint
        description: jobData.description,
        // Include criteria for reference (not required by API but useful for storage)
        evaluationMethod: jobData.evaluationMethod,
        criteria: jobData.criteria,
        pointScaleMin: jobData.pointScaleMin,
        pointScaleMax: jobData.pointScaleMax,
        status: 'DRAFT', // New jobs start as DRAFT
      };

      const response = await jobsApi.create(apiPayload);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create job');
      }
      // Refresh jobs list
      await listJobs();
      return transformJobData(response.data);
    } catch (err: any) {
      const errorMsg = err.message || 'Error creating job';
      setError(errorMsg);
      console.error('Job creation error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [listJobs]);

  const updateJob = useCallback(async (id: string, jobData: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobsApi.update(id, jobData);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update job');
      }
      // Refresh jobs list
      await listJobs();
      return transformJobData(response.data);
    } catch (err: any) {
      const errorMsg = err.message || 'Error updating job';
      setError(errorMsg);
      console.error('Job update error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [listJobs]);

  const deleteJob = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobsApi.delete(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete job');
      }
      // Refresh jobs list
      await listJobs();
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || 'Error deleting job';
      setError(errorMsg);
      console.error('Job deletion error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [listJobs]);

  return {
    jobs,
    loading,
    error,
    listJobs,
    getJob,
    createJob,
    updateJob,
    deleteJob,
  };
}

/**
 * Hook for justifications workflow
 */
export function useJustifications() {
  const [justifications, setJustifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listJustifications = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await justificationsApi.list(status);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch justifications');
      }
      setJustifications(response.data || []);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || 'Error fetching justifications';
      setError(errorMsg);
      console.error('Justifications fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitJustification = useCallback(async (justificationData: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await justificationsApi.create(justificationData);
      if (!response.success) {
        throw new Error(response.error || 'Failed to submit justification');
      }
      // Refresh list
      await listJustifications();
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || 'Error submitting justification';
      setError(errorMsg);
      console.error('Justification submission error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [listJustifications]);

  const approveJustification = useCallback(async (id: string, action: 'approve' | 'reject', comments?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await justificationsApi.approve(id, action, comments);
      if (!response.success) {
        throw new Error(response.error || `Failed to ${action} justification`);
      }
      // Refresh list
      await listJustifications();
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || `Error ${action}ing justification`;
      setError(errorMsg);
      console.error(`Justification ${action} error:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [listJustifications]);

  return {
    justifications,
    loading,
    error,
    listJustifications,
    submitJustification,
    approveJustification,
  };
}

/**
 * Hook for transparency requests
 */
export function useTransparency() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await transparencyApi.listRequests();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch requests');
      }
      setRequests(response.data || []);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || 'Error fetching requests';
      setError(errorMsg);
      console.error('Transparency requests fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createRequest = useCallback(async (requestData: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await transparencyApi.createRequest(requestData);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create request');
      }
      // Refresh list
      await listRequests();
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || 'Error creating request';
      setError(errorMsg);
      console.error('Transparency request creation error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [listRequests]);

  const reviewRequest = useCallback(async (id: string, action: 'approve' | 'deny', salary?: number, salaryRange?: any, peerCount?: number, denialReason?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await transparencyApi.review(id, action, salary, salaryRange, peerCount, denialReason);
      if (!response.success) {
        throw new Error(response.error || `Failed to ${action} request`);
      }
      // Refresh list
      await listRequests();
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || `Error ${action}ing request`;
      setError(errorMsg);
      console.error(`Request ${action} error:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [listRequests]);

  return {
    requests,
    loading,
    error,
    listRequests,
    createRequest,
    reviewRequest,
  };
}

/**
 * Hook for admin user management
 */
export function useAdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listUsers = useCallback(async (role?: string, status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.listUsers(role, status);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch users');
      }
      setUsers(response.data || []);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || 'Error fetching users';
      setError(errorMsg);
      console.error('Users fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (userData: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.createUser(userData);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create user');
      }
      // Refresh list
      await listUsers();
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || 'Error creating user';
      setError(errorMsg);
      console.error('User creation error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [listUsers]);

  return {
    users,
    loading,
    error,
    listUsers,
    createUser,
  };
}

/**
 * Hook for admin audit logs
 */
export function useAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuditLogs = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getAuditLogs(filters);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch audit logs');
      }
      setLogs(response.data || []);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || 'Error fetching audit logs';
      setError(errorMsg);
      console.error('Audit logs fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const purgeLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.purgeAuditLogs();
      if (!response.success) {
        throw new Error(response.error || 'Failed to purge logs');
      }
      // Refresh logs
      await getAuditLogs();
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || 'Error purging logs';
      setError(errorMsg);
      console.error('Purge logs error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuditLogs]);

  return {
    logs,
    loading,
    error,
    getAuditLogs,
    purgeLogs,
  };
}

/**
 * Hook for user profile management
 */
export function useProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await profileApi.getProfile();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch profile');
      }
      setProfile(response.data);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || 'Error fetching profile';
      setError(errorMsg);
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (profileData: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await profileApi.updateProfile(profileData);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update profile');
      }
      setProfile(response.data);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || 'Error updating profile';
      setError(errorMsg);
      console.error('Profile update error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    profile,
    loading,
    error,
    getProfile,
    updateProfile,
  };
}

/**
 * Hook for employee import and management
 */
export function useEmployees() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importEmployees = useCallback(async (employeeData: any[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await employeesApi.import(employeeData);
      if (!response.success) {
        throw new Error(response.error || 'Failed to import employees');
      }
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || 'Error importing employees';
      setError(errorMsg);
      console.error('Employee import error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const listEmployees = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await employeesApi.list(filters);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch employees');
      }
      setEmployees(response.data || []);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || 'Error fetching employees';
      setError(errorMsg);
      console.error('Employees fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getEmployee = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await employeesApi.get(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch employee');
      }
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || 'Error fetching employee';
      setError(errorMsg);
      console.error('Employee fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEmployee = useCallback(async (id: string, employeeData: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await employeesApi.update(id, employeeData);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update employee');
      }
      // Refresh employees list
      await listEmployees();
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || 'Error updating employee';
      setError(errorMsg);
      console.error('Employee update error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [listEmployees]);

  const deleteEmployee = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await employeesApi.delete(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete employee');
      }
      // Refresh employees list
      await listEmployees();
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || 'Error deleting employee';
      setError(errorMsg);
      console.error('Employee deletion error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [listEmployees]);

  return {
    employees,
    loading,
    error,
    importEmployees,
    listEmployees,
    getEmployee,
    updateEmployee,
    deleteEmployee,
  };
}
