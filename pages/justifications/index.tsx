import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/pages/_app';
import { useJustifications } from '@/hooks/useApi';

interface Justification {
  id: string;
  gapCategory: string;
  status: 'SUBMITTED' | 'MANAGER_APPROVED' | 'HR_APPROVED' | 'APPROVED' | 'REJECTED';
  submittedBy: string;
  submittedDate: string;
  lastUpdatedDate: string;
  approvalStage: string;
  currentApprover?: string;
  managedGap?: number;
  targetGap?: number;
  daysInApproval?: number;
}

interface JustificationDetail {
  id: string;
  gapCategory: string;
  affectedGroups: string;
  rootCause: string;
  explanation: string;
  correctiveMeasures: string;
  implementationTimeline: string;
  expectedOutcome: string;
  quantifiableTargets: string;
  status: string;
  submittedBy: string;
  submittedDate: string;
  approvals: Array<{
    stage: string;
    approver: string;
    status: string;
    approvalDate?: string;
    comments?: string;
  }>;
}

export default function JustificationsPage() {
  const router = useRouter();
  const { role } = useAuth();
  const { getLogs, loading, error } = useJustifications();

  const [justifications, setJustifications] = useState<Justification[]>([]);
  const [selectedJustification, setSelectedJustification] = useState<JustificationDetail | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    gapCategory: '',
  });
  const [sortBy, setSortBy] = useState('submittedDate');

  useEffect(() => {
    if (role && !['MANAGER', 'HR_SPECIALIST', 'COMPLIANCE_OFFICER', 'CFO', 'ADMIN'].includes(role)) {
      router.push('/dashboard');
    }
  }, [role]);

  useEffect(() => {
    loadJustifications();
  }, [filters, sortBy]);

  const loadJustifications = async () => {
    // Mock data - in real implementation, fetch from API
    const mockData: Justification[] = [
      {
        id: 'JUST-001',
        gapCategory: 'Job Level Distribution',
        status: 'APPROVED',
        submittedBy: 'Manager Name',
        submittedDate: '2026-05-01',
        lastUpdatedDate: '2026-05-14',
        approvalStage: 'Approved',
        managedGap: 2.5,
        targetGap: 1.0,
        daysInApproval: 13,
      },
      {
        id: 'JUST-002',
        gapCategory: 'Salary Progression Differences',
        status: 'HR_APPROVED',
        submittedBy: 'Another Manager',
        submittedDate: '2026-05-05',
        lastUpdatedDate: '2026-05-12',
        approvalStage: 'Awaiting Compliance Officer',
        currentApprover: 'Compliance Officer Team',
        managedGap: 4.2,
        targetGap: 2.0,
        daysInApproval: 7,
      },
      {
        id: 'JUST-003',
        gapCategory: 'Tenure-Related Differences',
        status: 'SUBMITTED',
        submittedBy: 'HR Specialist',
        submittedDate: '2026-05-10',
        lastUpdatedDate: '2026-05-10',
        approvalStage: 'Awaiting Manager Review',
        currentApprover: 'Department Manager',
        managedGap: 6.8,
        targetGap: 3.0,
        daysInApproval: 4,
      },
    ];

    // Apply filters
    let filtered = mockData.filter(j => {
      if (filters.status && j.status !== filters.status) return false;
      if (filters.gapCategory && j.gapCategory !== filters.gapCategory) return false;
      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'submittedDate') {
        return new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime();
      }
      if (sortBy === 'daysInApproval') {
        return (b.daysInApproval || 0) - (a.daysInApproval || 0);
      }
      return 0;
    });

    setJustifications(filtered);
  };

  const handleViewDetails = async (id: string) => {
    // Mock detail data
    const mockDetail: JustificationDetail = {
      id,
      gapCategory: 'Job Level Distribution',
      affectedGroups: 'Female employees in Engineering department',
      rootCause: 'Different distribution across job levels - 70% of senior engineers are male',
      explanation:
        'Analysis shows that while overall representation is balanced, female employees are concentrated in junior and mid-level positions. This is primarily due to historical hiring patterns and career progression differences.',
      correctiveMeasures:
        'Implement structured career development program, establish mentorship initiative, review promotion criteria for bias',
      implementationTimeline:
        'Q2 2026: Career development program launch\nQ3 2026: Mentorship matching\nQ4 2026: First promotion review cycle',
      expectedOutcome: 'Increase female representation in senior roles from 25% to 35% within 12 months',
      quantifiableTargets: '- Target: 35% female senior engineers by Q4 2027\n- Target: 5 female promotions to senior roles by end of 2026',
      status: 'APPROVED',
      submittedBy: 'John Manager',
      submittedDate: '2026-05-01',
      approvals: [
        {
          stage: 'Manager Review',
          approver: 'Department Manager',
          status: 'APPROVED',
          approvalDate: '2026-05-03',
          comments: 'Comprehensive plan with clear metrics',
        },
        {
          stage: 'HR Verification',
          approver: 'HR Specialist',
          status: 'APPROVED',
          approvalDate: '2026-05-08',
          comments: 'Career development program is feasible and aligned with policy',
        },
        {
          stage: 'Compliance Officer Review',
          approver: 'Compliance Officer',
          status: 'APPROVED',
          approvalDate: '2026-05-14',
          comments: 'Meets Directive 2023/970 requirements. Excellent justification.',
        },
      ],
    };

    setSelectedJustification(mockDetail);
  };

  const getStatusColor = (status: string) => {
    if (status === 'APPROVED') return 'badge-success';
    if (status === 'REJECTED') return 'badge-danger';
    if (status === 'HR_APPROVED' || status === 'MANAGER_APPROVED') return 'badge-warning';
    return 'badge-primary';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'Submitted';
      case 'MANAGER_APPROVED':
        return 'Manager Approved';
      case 'HR_APPROVED':
        return 'HR Approved';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
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
            <h1 className="text-2xl font-bold text-gray-900">Pay Gap Justifications</h1>
            <p className="text-sm text-gray-600 mt-2">
              Manage and track submitted pay gap justifications and their approval status
            </p>
          </div>
          {['MANAGER', 'HR_SPECIALIST', 'COMPLIANCE_OFFICER', 'CFO', 'ADMIN'].includes(role || '') && (
            <a href="/justifications/submit" className="btn btn-primary">
              Submit New Justification
            </a>
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
                <option value="SUBMITTED">Submitted</option>
                <option value="MANAGER_APPROVED">Manager Approved</option>
                <option value="HR_APPROVED">HR Approved</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label htmlFor="gapCategory" className="form-label">
                Gap Category
              </label>
              <select
                id="gapCategory"
                value={filters.gapCategory}
                onChange={e => setFilters(prev => ({ ...prev, gapCategory: e.target.value }))}
                className="form-select"
              >
                <option value="">All Categories</option>
                <option value="Job Level Distribution">Job Level Distribution</option>
                <option value="Salary Progression Differences">Salary Progression Differences</option>
                <option value="Tenure-Related Differences">Tenure-Related Differences</option>
                <option value="Role or Performance Differences">Role or Performance Differences</option>
                <option value="Education & Qualifications">Education & Qualifications</option>
                <option value="Other">Other</option>
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
                <option value="submittedDate">Most Recent</option>
                <option value="daysInApproval">Longest in Review</option>
              </select>
            </div>

            <div className="form-group mb-0 flex items-end">
              <button
                onClick={loadJustifications}
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

      {/* Justifications List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">
            {justifications.length} Justification{justifications.length !== 1 ? 's' : ''}
          </h2>
        </div>

        <div className="card-body">
          {justifications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No justifications found</p>
              {['MANAGER', 'HR_SPECIALIST', 'COMPLIANCE_OFFICER', 'CFO', 'ADMIN'].includes(role || '') && (
                <a href="/justifications/submit" className="btn btn-primary">
                  Submit One Now
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {justifications.map(justification => (
                <button
                  key={justification.id}
                  onClick={() => handleViewDetails(justification.id)}
                  className="w-full text-left border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{justification.id}</h3>
                        <span className={`badge ${getStatusColor(justification.status)}`}>
                          {getStatusLabel(justification.status)}
                        </span>
                        {justification.currentApprover && (
                          <span className="badge badge-secondary text-xs">
                            Awaiting {justification.currentApprover}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-700 mb-2">{justification.gapCategory}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <p className="text-gray-600">Submitted</p>
                          <p className="font-medium text-gray-900">{justification.submittedDate}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Submitted By</p>
                          <p className="font-medium text-gray-900">{justification.submittedBy}</p>
                        </div>
                        {justification.managedGap !== undefined && (
                          <div>
                            <p className="text-gray-600">Current Gap</p>
                            <p className="font-medium text-gray-900">{justification.managedGap.toFixed(2)}%</p>
                          </div>
                        )}
                        {justification.targetGap !== undefined && (
                          <div>
                            <p className="text-gray-600">Target Gap</p>
                            <p className="font-medium text-gray-900">{justification.targetGap.toFixed(2)}%</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 text-right">
                      <p className="text-sm text-gray-600">In Review</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {justification.daysInApproval}d
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedJustification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">{selectedJustification.id}</h2>
              <button
                onClick={() => setSelectedJustification(null)}
                className="text-gray-600 hover:text-gray-900 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Timeline */}
              <div className="grid grid-cols-3 gap-4">
                {selectedJustification.approvals.map((approval, idx) => (
                  <div key={idx} className="text-center">
                    <div
                      className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold ${
                        approval.status === 'APPROVED' ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      {approval.status === 'APPROVED' ? '✓' : idx + 1}
                    </div>
                    <p className="font-medium text-gray-900 text-sm">{approval.stage}</p>
                    <p className="text-xs text-gray-600 mt-1">{approval.approver}</p>
                    {approval.approvalDate && (
                      <p className="text-xs text-green-600 font-medium mt-1">{approval.approvalDate}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Approval Details */}
              <div className="space-y-3">
                {selectedJustification.approvals.map((approval, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                          approval.status === 'APPROVED' ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      >
                        {approval.status === 'APPROVED' ? '✓' : '○'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{approval.stage}</p>
                        <p className="text-sm text-gray-600">{approval.approver}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <span
                          className={`badge ${
                            approval.status === 'APPROVED'
                              ? 'badge-success'
                              : approval.status === 'REJECTED'
                              ? 'badge-danger'
                              : 'badge-warning'
                          }`}
                        >
                          {approval.status}
                        </span>
                        {approval.approvalDate && (
                          <p className="text-xs text-gray-600 mt-1">{approval.approvalDate}</p>
                        )}
                      </div>
                    </div>
                    {approval.comments && (
                      <p className="text-sm text-gray-700 ml-9 p-2 bg-gray-50 rounded mt-2">
                        {approval.comments}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Content */}
              <div className="border-t border-gray-200 pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Gap Category</h3>
                  <p className="text-gray-700">{selectedJustification.gapCategory}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Affected Groups</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedJustification.affectedGroups}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Root Cause</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedJustification.rootCause}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Explanation</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedJustification.explanation}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Corrective Measures</h3>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedJustification.correctiveMeasures}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Implementation Timeline</h3>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedJustification.implementationTimeline}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Expected Outcome</h3>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedJustification.expectedOutcome}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Quantifiable Targets</h3>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedJustification.quantifiableTargets}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
              <button onClick={() => window.print()} className="btn btn-secondary">
                Print
              </button>
              <button onClick={() => setSelectedJustification(null)} className="btn btn-secondary ml-auto">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
