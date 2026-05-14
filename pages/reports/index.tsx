import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/pages/_app';
import { useReports } from '@/hooks/useApi';

interface ComplianceReport {
  reportPeriod: string;
  generatedDate: string;
  overallComplianceStatus: 'COMPLIANT' | 'REQUIRES_JUSTIFICATION' | 'CRITICAL';
  articlesCompliance: Array<{
    article: string;
    title: string;
    status: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';
    details: string;
  }>;
  statisticsSummary: {
    totalEmployees: number;
    genderDistribution: {
      male: number;
      female: number;
      other: number;
    };
    payGapMetrics: {
      overallGap: number;
      gapsByDepartment: number;
      gapsByJobCode: number;
      employeesAffected: number;
    };
    justifications: {
      submitted: number;
      approved: number;
      pending: number;
      rejected: number;
    };
  };
  recommendations: string[];
  nextReviewDate: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const { role } = useAuth();
  const { getComplianceReport, loading, error } = useReports();

  const [activeReport, setActiveReport] = useState<'compliance' | 'statistics' | 'audit' | 'corrective'>('compliance');
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [mockReport, setMockReport] = useState<ComplianceReport | null>(null);

  useEffect(() => {
    if (role && !['COMPLIANCE_OFFICER', 'CFO', 'ADMIN'].includes(role)) {
      router.push('/dashboard');
    }
  }, [role]);

  useEffect(() => {
    loadReport();
  }, [reportYear]);

  const loadReport = async () => {
    // Mock compliance report
    const mock: ComplianceReport = {
      reportPeriod: `${reportYear}`,
      generatedDate: '2026-05-14',
      overallComplianceStatus: 'REQUIRES_JUSTIFICATION',
      articlesCompliance: [
        {
          article: 'Article 1',
          title: 'Scope and Definitions',
          status: 'COMPLIANT',
          details: 'Organization properly defined as private-sector employer with 250+ employees',
        },
        {
          article: 'Article 2',
          title: 'Right to Equal Pay',
          status: 'COMPLIANT',
          details: 'Equal pay for work of equal value policy implemented',
        },
        {
          article: 'Article 3',
          title: 'Job Evaluation Methodology',
          status: 'PARTIAL',
          details: '3 of 5 departments have documented job evaluation methodologies',
        },
        {
          article: 'Article 4',
          title: 'Gender Pay Gap Calculation',
          status: 'COMPLIANT',
          details: 'Standardized calculation methodology applied across all data',
        },
        {
          article: 'Article 5',
          title: 'Action Plans',
          status: 'PARTIAL',
          details: '2 action plans approved, 1 pending review',
        },
        {
          article: 'Article 7',
          title: 'Pay Gap Analysis Requirements',
          status: 'COMPLIANT',
          details: 'Quarterly analysis performed and documented',
        },
        {
          article: 'Article 10',
          title: 'Individual Transparency Right',
          status: 'COMPLIANT',
          details: '5 transparency requests processed within 15-day deadline',
        },
        {
          article: 'Article 15',
          title: 'Audit Trail & Documentation',
          status: 'COMPLIANT',
          details: 'Immutable audit logs maintained for all operations',
        },
      ],
      statisticsSummary: {
        totalEmployees: 547,
        genderDistribution: {
          male: 312,
          female: 228,
          other: 7,
        },
        payGapMetrics: {
          overallGap: 6.8,
          gapsByDepartment: 5,
          gapsByJobCode: 12,
          employeesAffected: 87,
        },
        justifications: {
          submitted: 3,
          approved: 1,
          pending: 2,
          rejected: 0,
        },
      },
      recommendations: [
        'Complete job evaluation methodology for remaining 2 departments',
        'Accelerate approval process for 2 pending action plans',
        'Increase manager training on pay gap justification process',
        'Implement quarterly review cycle for pay gap analysis',
        'Expand mentorship program for underrepresented gender in senior roles',
      ],
      nextReviewDate: '2026-08-14',
    };

    setMockReport(mock);
    setReport(mock);
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'COMPLIANT') return 'badge-success';
    if (status === 'PARTIAL') return 'badge-warning';
    return 'badge-danger';
  };

  const getComplianceColor = (status: string) => {
    if (status === 'COMPLIANT') return 'bg-green-50 border-green-200';
    if (status === 'REQUIRES_JUSTIFICATION') return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const complianceTextColor = (status: string) => {
    if (status === 'COMPLIANT') return 'text-green-900';
    if (status === 'REQUIRES_JUSTIFICATION') return 'text-yellow-900';
    return 'text-red-900';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compliance Reports</h1>
            <p className="text-sm text-gray-600 mt-2">
              EU Directive 2023/970 compliance reporting and administrative dashboards
            </p>
          </div>
          <div className="form-group mb-0">
            <label htmlFor="reportYear" className="form-label">
              Report Year
            </label>
            <select
              id="reportYear"
              value={reportYear}
              onChange={e => setReportYear(parseInt(e.target.value))}
              className="form-select"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card">
        <div className="card-body">
          <div className="flex gap-2 overflow-x-auto border-b border-gray-200 -mb-4 -mx-6 px-6">
            {(['compliance', 'statistics', 'audit', 'corrective'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveReport(tab)}
                className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
                  activeReport === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'compliance' && 'Compliance Status'}
                {tab === 'statistics' && 'Statistics'}
                {tab === 'audit' && 'Audit Trail'}
                {tab === 'corrective' && 'Corrective Measures'}
              </button>
            ))}
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

      {/* Loading State */}
      {loading && (
        <div className="card">
          <div className="card-body text-center py-8">
            <p className="text-gray-600">
              <span className="spinner mr-2"></span>
              Generating report...
            </p>
          </div>
        </div>
      )}

      {/* Compliance Status Tab */}
      {activeReport === 'compliance' && report && !loading && (
        <div className="space-y-6">
          {/* Overall Status */}
          <div className={`card border-2 ${getComplianceColor(report.overallComplianceStatus)}`}>
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Overall Compliance Status</p>
                  <h2 className={`text-3xl font-bold ${complianceTextColor(report.overallComplianceStatus)}`}>
                    {report.overallComplianceStatus === 'COMPLIANT'
                      ? 'Compliant'
                      : report.overallComplianceStatus === 'REQUIRES_JUSTIFICATION'
                      ? 'Requires Justification'
                      : 'Critical'}
                  </h2>
                </div>
                <div className="text-4xl">
                  {report.overallComplianceStatus === 'COMPLIANT' && '✓'}
                  {report.overallComplianceStatus === 'REQUIRES_JUSTIFICATION' && '⚠️'}
                  {report.overallComplianceStatus === 'CRITICAL' && '❌'}
                </div>
              </div>
            </div>
          </div>

          {/* Articles Compliance */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Directive Articles Compliance</h2>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {report.articlesCompliance.map((article, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{article.article}: {article.title}</h4>
                          <span className={`badge ${getStatusBadgeClass(article.status)}`}>
                            {article.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{article.details}</p>
                      </div>
                      <div className="text-2xl flex-shrink-0">
                        {article.status === 'COMPLIANT' && '✓'}
                        {article.status === 'PARTIAL' && '◐'}
                        {article.status === 'NON_COMPLIANT' && '✕'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Recommendations</h2>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  {report.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-blue-600 font-bold flex-shrink-0">→</span>
                      <p className="text-sm text-blue-900">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Next Review */}
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-gray-600">Next Compliance Review</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{report.nextReviewDate}</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeReport === 'statistics' && report && !loading && (
        <div className="space-y-6">
          {/* Employee Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-600 mb-2">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900">{report.statisticsSummary.totalEmployees}</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-600 mb-2">Gender Distribution</p>
                <div className="space-y-2 text-sm mt-3">
                  <div className="flex justify-between">
                    <span>Male:</span>
                    <span className="font-semibold">
                      {report.statisticsSummary.genderDistribution.male} (
                      {((report.statisticsSummary.genderDistribution.male / report.statisticsSummary.totalEmployees) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Female:</span>
                    <span className="font-semibold">
                      {report.statisticsSummary.genderDistribution.female} (
                      {((report.statisticsSummary.genderDistribution.female / report.statisticsSummary.totalEmployees) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other:</span>
                    <span className="font-semibold">
                      {report.statisticsSummary.genderDistribution.other} (
                      {((report.statisticsSummary.genderDistribution.other / report.statisticsSummary.totalEmployees) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-600 mb-2">Employees Affected by Gap</p>
                <p className="text-3xl font-bold text-red-600">{report.statisticsSummary.payGapMetrics.employeesAffected}</p>
                <p className="text-xs text-gray-600 mt-2">
                  {(
                    (report.statisticsSummary.payGapMetrics.employeesAffected / report.statisticsSummary.totalEmployees) *
                    100
                  ).toFixed(1)}% of workforce
                </p>
              </div>
            </div>
          </div>

          {/* Pay Gap Metrics */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Pay Gap Metrics</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Overall Gap</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {report.statisticsSummary.payGapMetrics.overallGap.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-semibold">By Department</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {report.statisticsSummary.payGapMetrics.gapsByDepartment}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-semibold">By Job Code</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {report.statisticsSummary.payGapMetrics.gapsByJobCode}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Justification Status */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Justification Status</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Submitted</p>
                  <p className="text-3xl font-bold text-blue-600">{report.statisticsSummary.justifications.submitted}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Approved</p>
                  <p className="text-3xl font-bold text-green-600">{report.statisticsSummary.justifications.approved}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{report.statisticsSummary.justifications.pending}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Rejected</p>
                  <p className="text-3xl font-bold text-red-600">{report.statisticsSummary.justifications.rejected}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Tab */}
      {activeReport === 'audit' && !loading && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Audit Trail & System Events</h2>
          </div>
          <div className="card-body">
            <p className="text-gray-700 mb-4">
              Complete immutable audit trail of all system operations per Directive Article 15
            </p>
            <button onClick={() => router.push('/audit')} className="btn btn-primary">
              View Full Audit Trail
            </button>
          </div>
        </div>
      )}

      {/* Corrective Measures Tab */}
      {activeReport === 'corrective' && !loading && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Corrective Measures & Action Plans</h2>
          </div>
          <div className="card-body">
            <p className="text-gray-700 mb-4">
              Track implementation status of corrective measures and action plans
            </p>
            <button onClick={() => router.push('/corrective-measures')} className="btn btn-primary">
              View Corrective Measures
            </button>
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Export Report</h2>
        </div>
        <div className="card-body">
          <p className="text-sm text-gray-600 mb-4">
            Download this compliance report in various formats for regulatory submission or archival
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="btn btn-secondary">
              📄 Export as PDF
            </button>
            <button className="btn btn-secondary">
              📊 Export as Excel
            </button>
            <button onClick={() => window.print()} className="btn btn-secondary">
              🖨️ Print Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
