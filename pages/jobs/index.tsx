import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/pages/_app';
import { useLanguage } from '@/utils/useLanguage';
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
  const { t } = useLanguage();
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
        return t('jobs.draft');
      case 'SUBMITTED':
        return t('jobs.submittedForReview');
      case 'ACTIVE':
        return t('jobs.active');
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
            <h1 className="text-2xl font-bold text-gray-900">{t('jobs.title')}</h1>
            <p className="text-sm text-gray-600 mt-2">
              {t('jobs.description')}
            </p>
          </div>
          {['HR_SPECIALIST', 'ADMIN'].includes(role || '') && (
            <button onClick={() => router.push('/jobs/create')} className="btn btn-primary">
              {t('jobs.create')}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">{t('jobs.filtersAndSorting')}</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="form-group mb-0">
              <label htmlFor="department" className="form-label">
                {t('common.department')}
              </label>
              <select
                id="department"
                value={filters.department}
                onChange={e => setFilters(prev => ({ ...prev, department: e.target.value }))}
                className="form-select"
              >
                <option value="">{t('common.allDepartments')}</option>
                <option value="Engineering">{t('common.engineering')}</option>
                <option value="Sales">{t('common.sales')}</option>
                <option value="Marketing">{t('common.marketing')}</option>
                <option value="HR">{t('common.humanResources')}</option>
                <option value="Finance">{t('common.finance')}</option>
                <option value="Operations">{t('common.operations')}</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label htmlFor="status" className="form-label">
                {t('jobs.status')}
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="form-select"
              >
                <option value="">{t('jobs.allStatuses')}</option>
                <option value="DRAFT">{t('jobs.draft')}</option>
                <option value="SUBMITTED">{t('jobs.submitted')}</option>
                <option value="ACTIVE">{t('jobs.active')}</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label htmlFor="sortBy" className="form-label">
                {t('jobs.sortBy')}
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="form-select"
              >
                <option value="createdDate">{t('jobs.mostRecent')}</option>
                <option value="title">{t('jobs.jobTitle')}</option>
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
                    {t('jobs.searching')}
                  </>
                ) : (
                  t('jobs.applyFilters')
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <p className="font-medium">{t('common.error')}</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      )}

      {/* Jobs List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">
            {jobs.length} {t('jobs.jobCount')}{jobs.length !== 1 ? 's' : ''}
          </h2>
        </div>

        <div className="card-body">
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">{t('jobs.noJobsFound')}</p>
              {['HR_SPECIALIST', 'ADMIN'].includes(role || '') && (
                <button onClick={() => router.push('/jobs/create')} className="btn btn-primary">
                  {t('jobs.createFirstJob')}
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
                              {t('common.edit')}
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
                              {t('jobs.activate')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">{t('jobs.created')}</p>
                      <p className="font-medium text-gray-900">{job.createdDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t('jobs.lastUpdated')}</p>
                      <p className="font-medium text-gray-900">{job.lastUpdatedDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t('jobs.evaluationMethod')}</p>
                      <p className="font-medium text-gray-900">{job.evaluationMethod}</p>
                    </div>
                  </div>

                  {job.pointScale && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                      {t('jobs.pointScale')}: {job.pointScale.min} - {job.pointScale.max}
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
                  <p className="text-xs text-gray-600 uppercase font-semibold">{t('jobs.status')}</p>
                  <p className="font-bold text-gray-900 mt-2">{getStatusLabel(selectedJob.status)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-semibold">{t('jobs.created')}</p>
                  <p className="font-bold text-gray-900 mt-2">{selectedJob.createdDate}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-semibold">{t('common.edit')}</p>
                  <p className="font-bold text-gray-900 mt-2">{selectedJob.createdBy}</p>
                </div>
              </div>

              {/* Evaluation Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">{t('jobs.evaluationCriteria')}</h3>
                <p className="text-sm text-gray-700 mb-3">{t('jobs.evaluationMethod')}: {selectedJob.evaluationMethod}</p>

                {selectedJob.weightedCriteria && (
                  <div className="space-y-2">
                    {selectedJob.weightedCriteria.map((criterion, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900">{criterion.name}</span>
                        <span className="text-lg font-bold text-blue-600">{criterion.weight}%</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-lg font-semibold">
                      <span className="text-gray-900">{t('jobs.totalWeight')}</span>
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
                  <h3 className="font-semibold text-gray-900 mb-3">{t('jobs.pointScale')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{t('jobs.minimumPoints')}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{selectedJob.pointScale.min}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{t('jobs.maximumPoints')}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{selectedJob.pointScale.max}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Article Reference */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-medium text-blue-900 mb-2">{t('jobs.directiveCompliance')}</p>
                <p className="text-sm text-blue-800">
                  {t('jobs.complianceMessage')}
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
                  {t('common.edit')}
                </button>
              )}
              <button onClick={() => window.print()} className="btn btn-secondary">
                {t('jobs.print')}
              </button>
              <button onClick={() => setSelectedJob(null)} className="btn btn-secondary ml-auto">
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
