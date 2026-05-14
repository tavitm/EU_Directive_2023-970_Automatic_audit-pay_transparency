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

      try {
        const url = `/api${endpoint}`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...options.headers,
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, {
          method: options.method || 'GET',
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw {
            message: errorData.error || 'API request failed',
            details: errorData.details,
            statusCode: response.status,
          };
        }

        const responseData = await response.json();
        setData(responseData.data || responseData);
        return responseData.data || responseData;
      } catch (err: any) {
        const apiError: ApiError = {
          message: err.message || 'An error occurred',
          details: err.details,
          statusCode: err.statusCode,
        };
        setError(apiError);
        console.error('API Error:', apiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  return { data, loading, error, request };
}

/* Specialized Hooks */

export function useJobs() {
  const { request, ...state } = useApi();

  const createJob = async (jobData: any) => {
    return request('/jobs/create', {
      method: 'POST',
      body: jobData,
    });
  };

  const listJobs = async (filters?: any) => {
    const query = new URLSearchParams(filters || {}).toString();
    return request(`/jobs/list${query ? `?${query}` : ''}`);
  };

  const activateJob = async (jobId: string) => {
    return request('/jobs/activate', {
      method: 'PUT',
      body: { jobId },
    });
  };

  return { createJob, listJobs, activateJob, ...state };
}

export function useEmployees() {
  const { request, ...state } = useApi();

  const importEmployees = async (employees: any[]) => {
    return request('/employees/import', {
      method: 'POST',
      body: { employees },
    });
  };

  const requestTransparency = async (jobCode: string, department: string, gender?: string) => {
    return request('/employees/transparency-request', {
      method: 'POST',
      body: { jobCode, department, gender },
    });
  };

  return { importEmployees, requestTransparency, ...state };
}

export function useAnalysis() {
  const { request, ...state } = useApi();

  const calculateGap = async (filters?: any) => {
    return request('/analysis/calculate-gap', {
      method: 'POST',
      body: filters || {},
    });
  };

  return { calculateGap, ...state };
}

export function useJustifications() {
  const { request, ...state } = useApi();

  const submitJustification = async (justificationData: any) => {
    return request('/justifications/submit', {
      method: 'POST',
      body: justificationData,
    });
  };

  const approveJustification = async (justificationId: string, approvalStatus: string, comments?: string) => {
    return request('/justifications/approve', {
      method: 'PUT',
      body: { justificationId, approvalStatus, comments },
    });
  };

  return { submitJustification, approveJustification, ...state };
}

export function useAudit() {
  const { request, ...state } = useApi();

  const getLogs = async (filters?: any) => {
    const query = new URLSearchParams(filters || {}).toString();
    return request(`/audit/logs${query ? `?${query}` : ''}`);
  };

  return { getLogs, ...state };
}

export function useReports() {
  const { request, ...state } = useApi();

  const getComplianceReport = async (reportYear?: number) => {
    const query = reportYear ? `?reportYear=${reportYear}` : '';
    return request(`/reports/compliance${query}`);
  };

  return { getComplianceReport, ...state };
}
