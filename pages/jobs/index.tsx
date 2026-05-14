import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/pages/_app';
import { useJobs } from '@/hooks/useApi';

interface JobEvaluation {
  id: string;
  jobCode: string;
  title: string;
  department: string;
  status: 'DRAFT' | 'SUBMITTED' | 'ACTIVE';
  createdDate: string;
  lastUpdatedDate: string;
  evaluationMethod?: string;
  weightedCriteria?: Array<{
    name: string;
    weight: number;
  }>;
  pointScale?: {
    min: number;
    max: number;
  };
  createdBy?: string;
}

export default function JobsPage() {
  const router = useRouter();
  const { role } = useAuth();
  const { listJobs, loading, error } = useJobs();

  const [jobs, setJobs] = useState<JobEvaluation[]>([]);
  const [filters, setFilters] = useState({
    department: '',
    status: '',
  });
  const [selectedJob, setSelectedJob] = useState<JobEvaluation | null>(null);
  const [sortBy, setSortBy] = useState('createdDate');

  useEffect(() => {
    if (role && !['HR_SPECIALIST', 'COMPLIANCE_OFFICER', 'CFO', 'ADMIN'].includes(role)) {
      router.push('/dashboard');
    }
  }, [role]);

  useEffect(() => {
    loadJobs();
  }, [filters, sortBy]);

  const loadJobs = async () => {
    // Mock data - in real implementation, fetch from API
    const mockData: JobEvaluation[] = [
      {
        id: 'JOB-001',
        jobCode: 'ENG-001',
        title: 'Senior Software Engineer',
        department: 'Engineering',
        status: 'ACTIVE',
        createdDate: '2026-04-01',
        lastUpdatedDate: '2026-04-15',
        evaluationMethod: 'Point-Factor Method',
        weightedCriteria: [
          { name: 'Education & Skills', weight: 30 },
          { name: 'Experience', weight: 25 },
          { name: 'Complexity', weight: 25 },
          { name: 'Accountability', weight: 20 },
        ],
        pointScale: { min: 150, max: 300 },
        createdBy: 'HR Manager',
      },
      {
        id: 'JOB-002',
        jobCode: 'SAL-001',
        title: 'Sales Director',
        department: 'Sales',
        status: 'ACTIVE',
        createdDate: '2026-03-15',
        lastUpdatedDate: '2026-04-20',
        evaluationMethod: 'Point-Factor Method',
        weightedCriteria: [
          { name: 'Education & Skills', weight: 20 },
          { name: 'Experience', weight: 30 },
          { name: 'Leadership', weight: 25 },
          { name: 'Performance Metrics', weight: 25 },
        ],
        pointScale: { min: 180, max: 320 },
        createdBy: 'HR Manager',
      },
      {
        id: 'JOB-003',
        jobCode: 'MKT-001',
        title: 'Marketing Manager',
        department: 'Marketing',
        status: 'SUBMITTED',
        createdDate: '2026-05-01',
        lastUpdatedDate: '2026-05-10',
        evaluationMethod: 'Point-Factor Method',
        weightedCriteria: [
          { name: 'Education & Skills', weight: 25 },
          { name: 'Experience', weight: 25 },
          { name: 'Complexity', weight: 25 },
          { name: 'Accountability', weight: 25 },
        ],
        pointScale: { min: 140, max: 280 },
        createdBy: 'Department Manager',
      },
      {
        id: 'JOB-004',
        jobCode: 'HR-001',
        title: 'HR Specialist',
        department: 'HR',
        status: 'DRAFT',
        createdDate: '2026-05-05',
        lastUpdatedDate: '2026-05-12',
        evaluationMethod: 'Point-Factor Method',
        weightedCriteria: [
          { name: 'Education & Skills', weight: 30 },
          { name: 'Experience', weight: 20 },
          { name: 'Complexity', weight: 25 },
          { name: 'Accountability', weight: 25 },
        ],
        pointScale: { min: 120, max: 260 },
        createdBy: 'HR Manager',
      },
    ];

    // Apply filters
    let filtered = mockData.filter(j => {
      if (filters.department && j.department !== filters.department) return false;
      if (filters.status && j.status !== filters.status) return false;
      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'createdDate') {
        return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    setJobs(filtered);
  };

  const getStatusColor = (status: string) => {
    if (status === 'ACTIVE') return 'badge-success';
    if (status === 'SUBMITTED') return 'badge-warning';
    return 'badge-primary';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'SUBMITTED':
        return 'Submitted for Review';
      case 'ACTIVE':
        return 'Active';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Evaluations</h1>
            <p className="text-sm text-gray-600 mt-2">
              Manage job evaluation methodologies per EU Directive 2023/970, Article 3
            </p>
          </div>
          {['HR_SPECIALIST', 'ADMIN'].includes(role || '') && (
            <button onClick={() => router.push('/jobs/create')} className="btn btn-primary">
              Create Job Evaluation
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Filters & Sorting</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="form-group mb-0">
              <label htmlFor="department" className="form-label">
                Department
              </label>
              <select
                id="department"
                value={filters.department}
                onChange={e => setFilters(prev => ({ ...prev, department: e.target.value }))}
                className="form-select"
              >
                <option value="">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="form-select"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="ACTIVE">Active</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label htmlFor="sortBy" className="form-label">
                Sort By
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="form-select"
              >
                <option value="createdDate">Most Recent</option>
                <option value="title">Job Title</option>
              </select>
            </div>

            <div className="form-group mb-0 flex items-end">
              <button
                onClick={loadJobs}
                className="btn btn-secondary w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner mr-2"></span>
                    Searching...
                  </>
                ) : (
                  'Apply Filters'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      )}

      {/* Jobs List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">
            {jobs.length} Job Evaluation{jobs.length !== 1 ? 's' : ''}
          </h2>
        </div>

        <div className="card-body">
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No job evaluations found</p>
              {['HR_SPECIALIST', 'ADMIN'].includes(role || '') && (
                <button onClick={() => router.push('/jobs/create')} className="btn btn-primary">
                  Create First Job Evaluation
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <span className={`badge ${getStatusColor(job.status)}`}>
                          {getStatusLabel(job.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {job.jobCode} • {job.department}
                      </p>
                    </div>
                    <div className="text-right">
                      {['HR_SPECIALIST', 'ADMIN'].includes(role || '') && (
                        <div className="flex gap-2">
                          {job.status === 'DRAFT' && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                router.push(`/jobs/${job.id}/edit`);
                              }}
                              className="btn btn-sm btn-secondary"
                            >
                              Edit
                            </button>
                          )}
                          {job.status === 'SUBMITTED' && ['COMPLIANCE_OFFICER', 'ADMIN'].includes(role || '') && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                // router.push(`/jobs/${job.id}/activate`);
                              }}
                              className="btn btn-sm btn-primary"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Created</p>
                      <p className="font-medium text-gray-900">{job.createdDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Last Updated</p>
                      <p className="font-medium text-gray-900">{job.lastUpdatedDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Evaluation Method</p>
                      <p className="font-medium text-gray-900">{job.evaluationMethod}</p>
                    </div>
                  </div>

                  {job.pointScale && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                      Point Scale: {job.pointScale.min} - {job.pointScale.max}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedJob.jobCode} • {selectedJob.department}
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-600 hover:text-gray-900 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Timeline */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Status</p>
                  <p className="font-bold text-gray-900 mt-2">{getStatusLabel(selectedJob.status)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Created</p>
                  <p className="font-bold text-gray-900 mt-2">{selectedJob.createdDate}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Created By</p>
                  <p className="font-bold text-gray-900 mt-2">{selectedJob.createdBy}</p>
                </div>
              </div>

              {/* Evaluation Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Evaluation Criteria</h3>
                <p className="text-sm text-gray-700 mb-3">Method: {selectedJob.evaluationMethod}</p>

                {selectedJob.weightedCriteria && (
                  <div className="space-y-2">
                    {selectedJob.weightedCriteria.map((criterion, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900">{criterion.name}</span>
                        <span className="text-lg font-bold text-blue-600">{criterion.weight}%</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-lg font-semibold">
                      <span className="text-gray-900">Total Weight</span>
                      <span className="text-lg text-blue-600">
                        {selectedJob.weightedCriteria.reduce((sum, c) => sum + c.weight, 0)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Point Scale */}
              {selectedJob.pointScale && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Point Scale</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Minimum Points</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{selectedJob.pointScale.min}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Maximum Points</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{selectedJob.pointScale.max}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Article Reference */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-medium text-blue-900 mb-2">📋 Directive Compliance</p>
                <p className="text-sm text-blue-800">
                  This job evaluation methodology implements EU Directive 2023/970, Article 3 requirements for transparent
                  and objective job evaluation systems.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
              {['HR_SPECIALIST', 'ADMIN'].includes(role || '') && selectedJob.status === 'DRAFT' && (
                <button
                  onClick={() => {
                    router.push(`/jobs/${selectedJob.id}/edit`);
                    setSelectedJob(null);
                  }}
                  className="btn btn-primary"
                >
                  Edit
                </button>
              )}
              <button onClick={() => window.print()} className="btn btn-secondary">
                Print
              </button>
              <button onClick={() => setSelectedJob(null)} className="btn btn-secondary ml-auto">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
