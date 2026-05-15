/**
 * API Client Utility
 * Handles all API communication with proper error handling and token management
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode: number;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  token?: string;
}

class ApiClient {
  private baseUrl: string = '/api';
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  /**
   * Get authorization token from localStorage
   */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  }

  /**
   * Get headers with authorization token
   */
  private getHeaders(options?: RequestOptions): Record<string, string> {
    const headers = { ...this.defaultHeaders, ...options?.headers };

    const token = options?.token || this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Make API request
   */
  async request<T = any>(
    endpoint: string,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options?.method || 'GET';
    const headers = this.getHeaders(options);

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (options?.body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, fetchOptions);

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}`,
        }));

        // Handle 401 - Unauthorized (token expired)
        if (response.status === 401) {
          this.handleTokenExpired();
        }

        return {
          success: false,
          error: errorData.error || `Request failed with status ${response.status}`,
          statusCode: response.status,
        };
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`API request failed: ${endpoint}`, error);
      return {
        success: false,
        error: error.message || 'Network error',
        statusCode: 0,
      };
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', token });
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    token?: string
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, token });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    body?: any,
    token?: string
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, token });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', token });
  }

  /**
   * Handle token expiration - clear auth and redirect to login
   */
  private handleTokenExpired() {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');

    window.location.href = '/login';
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

/**
 * Authentication API methods
 */
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),

  logout: () =>
    apiClient.post('/auth/logout'),

  verify: () =>
    apiClient.get('/auth/verify'),

  getDemoAccounts: () =>
    apiClient.get('/auth/demo-accounts'),
};

/**
 * Analysis API methods
 */
export const analysisApi = {
  getPayGap: (jobGroup?: string) =>
    jobGroup
      ? apiClient.get(`/analysis/pay-gap?jobGroup=${jobGroup}`)
      : apiClient.get('/analysis/pay-gap'),
};

/**
 * Jobs API methods
 */
export const jobsApi = {
  list: (status?: string) =>
    status
      ? apiClient.get(`/jobs?status=${status}`)
      : apiClient.get('/jobs'),

  get: (id: string) =>
    apiClient.get(`/jobs/${id}`),

  create: (job: any) =>
    apiClient.post('/jobs', job),

  update: (id: string, job: any) =>
    apiClient.put(`/jobs/${id}`, job),

  delete: (id: string) =>
    apiClient.delete(`/jobs/${id}`),
};

/**
 * Justifications API methods
 */
export const justificationsApi = {
  list: (status?: string) =>
    status
      ? apiClient.get(`/justifications?status=${status}`)
      : apiClient.get('/justifications'),

  create: (justification: any) =>
    apiClient.post('/justifications', justification),

  approve: (id: string, action: 'approve' | 'reject', comments?: string) =>
    apiClient.post(`/justifications/${id}/approve`, { action, comments }),
};

/**
 * Transparency Requests API methods
 */
export const transparencyApi = {
  listRequests: () =>
    apiClient.get('/transparency/requests'),

  createRequest: (request: any) =>
    apiClient.post('/transparency/requests', request),

  review: (id: string, action: 'approve' | 'deny', salary?: number, salaryRange?: any, peerCount?: number, denialReason?: string) =>
    apiClient.post(`/transparency/${id}/review`, {
      action,
      salary,
      salaryRange,
      peerCount,
      denialReason,
    }),
};

/**
 * Reports API methods
 */
export const reportsApi = {
  getReport: (reportType: 'overview' | 'analysis' | 'justifications' | 'trends') =>
    apiClient.get(`/reports/compliance?reportType=${reportType}`),

  exportReport: (format: 'pdf' | 'excel' | 'csv', reportType: string) =>
    apiClient.post('/reports/compliance', { format, reportType }),
};

/**
 * Admin API methods
 */
export const adminApi = {
  listUsers: (role?: string, status?: string) => {
    let endpoint = '/admin/users';
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (status) params.append('status', status);
    if (params.toString()) endpoint += `?${params.toString()}`;
    return apiClient.get(endpoint);
  },

  createUser: (user: any) =>
    apiClient.post('/admin/users', user),

  getAuditLogs: (filters?: any) => {
    const params = new URLSearchParams();
    if (filters?.action) params.append('action', filters.action);
    if (filters?.resource) params.append('resource', filters.resource);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit);
    if (filters?.offset) params.append('offset', filters.offset);

    let endpoint = '/admin/audit-logs';
    if (params.toString()) endpoint += `?${params.toString()}`;
    return apiClient.get(endpoint);
  },

  purgeAuditLogs: () =>
    apiClient.delete('/admin/audit-logs'),

  getCorrectiveMeasures: (filters?: any) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.jobCode) params.append('jobCode', filters.jobCode);
    if (filters?.limit) params.append('limit', filters.limit);
    if (filters?.offset) params.append('offset', filters.offset);

    let endpoint = '/admin/corrective-measures';
    if (params.toString()) endpoint += `?${params.toString()}`;
    return apiClient.get(endpoint);
  },

  updateCorrectiveMeasure: (id: string, updates: any) =>
    apiClient.put(`/admin/corrective-measures?id=${id}`, updates),

  createDatabaseBackup: () =>
    apiClient.get('/admin/backup'),
};

/**
 * Profile API methods
 */
export const profileApi = {
  getProfile: () =>
    apiClient.get('/profile/me'),

  updateProfile: (profile: any) =>
    apiClient.put('/profile/me', profile),
};

/**
 * Employees API methods
 */
export const employeesApi = {
  import: (employees: any[]) =>
    apiClient.post('/employees/import', { employees }),

  list: (filters?: any) => {
    const params = new URLSearchParams();
    if (filters?.department) params.append('department', filters.department);
    if (filters?.jobCode) params.append('jobCode', filters.jobCode);
    if (filters?.page) params.append('page', filters.page);
    if (filters?.limit) params.append('limit', filters.limit);

    let endpoint = '/employees';
    if (params.toString()) endpoint += `?${params.toString()}`;
    return apiClient.get(endpoint);
  },

  get: (id: string) =>
    apiClient.get(`/employees/${id}`),

  update: (id: string, employee: any) =>
    apiClient.put(`/employees/${id}`, employee),

  delete: (id: string) =>
    apiClient.delete(`/employees/${id}`),
};
