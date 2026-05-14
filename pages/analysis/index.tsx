import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/pages/_app';
import { useAnalysis } from '@/hooks/useApi';

interface GapAnalysisResult {
  analysis?: {
    gapAnalysis?: {
      adjustedGap: number;
      unadjustedGap: number;
    };
    statisticalSignificance?: {
      tStatistic: number;
      pValue: number;
      significantAt95Confidence: boolean;
      sampleSize: number;
    };
    employeeData?: {
      total: number;
      maleCount: number;
      femaleCount: number;
      otherCount: number;
      maleAvgSalary: number;
      femaleAvgSalary: number;
      otherAvgSalary?: number;
    };
    byDepartment?: Array<{
      department: string;
      gap: number;
      maleCount: number;
      femaleCount: number;
      maleAvgSalary: number;
      femaleAvgSalary: number;
    }>;
    byJobCode?: Array<{
      jobCode: string;
      gap: number;
      maleCount: number;
      femaleCount: number;
      maleAvgSalary: number;
      femaleAvgSalary: number;
    }>;
    byTenure?: Array<{
      tenureRange: string;
      gap: number;
      employeeCount: number;
    }>;
  };
  complianceStatus?: 'COMPLIANT' | 'REQUIRES_JUSTIFICATION' | 'CRITICAL';
  recommendations?: string[];
}

export default function AnalysisPage() {
  const router = useRouter();
  const { role } = useAuth();
  const { calculateGap, loading, error } = useAnalysis();

  const [results, setResults] = useState<GapAnalysisResult | null>(null);
  const [filters, setFilters] = useState({
    department: '',
    jobCode: '',
    salaryRange: '',
    tenure: '',
    adjustForJobEvaluation: false,
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'department' | 'job' | 'tenure'>('overview');
  const [expandedDetails, setExpandedDetails] = useState<string | null>(null);

  // Redirect if not authorized
  useEffect(() => {
    if (role && !['MANAGER', 'HR_SPECIALIST', 'COMPLIANCE_OFFICER', 'CFO', 'ADMIN'].includes(role)) {
      router.push('/dashboard');
    }
  }, [role]);

  // Load analysis on mount and filter changes
  useEffect(() => {
    loadAnalysis();
  }, [filters]);

  const loadAnalysis = async () => {
    const filterParams = Object.entries(filters)
      .filter(([_, value]) => value !== '' && value !== false)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const data = await calculateGap(filterParams);
    if (data) {
      setResults(data);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const getComplianceColor = (status?: string) => {
    if (status === 'COMPLIANT') return 'bg-green-50 border-green-200';
    if (status === 'REQUIRES_JUSTIFICATION') return 'bg-yellow-50 border-yellow-200';
    if (status === 'CRITICAL') return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getGapColor = (gap: number) => {
    if (Math.abs(gap) < 5) return 'text-green-600';
    if (Math.abs(gap) < 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">Gender Pay Gap Analysis</h1>
          <p className="text-sm text-gray-600 mt-2">
            Detailed analysis of salary differences by gender across your organization
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="form-group mb-0">
              <label htmlFor="department" className="form-label">
                Department
              </label>
              <select
                id="department"
                name="department"
                value={filters.department}
                onChange={handleFilterChange}
                className="form-select"
              >
                <option value="">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
                <option value="Finance">Finance</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label htmlFor="jobCode" className="form-label">
                Job Code
              </label>
              <input
                id="jobCode"
                name="jobCode"
                type="text"
                value={filters.jobCode}
                onChange={handleFilterChange}
                placeholder="e.g., ENG-001"
                className="form-input"
              />
            </div>

            <div className="form-group mb-0">
              <label htmlFor="salaryRange" className="form-label">
                Salary Range
              </label>
              <select
                id="salaryRange"
                name="salaryRange"
                value={filters.salaryRange}
                onChange={handleFilterChange}
                className="form-select"
              >
                <option value="">All Ranges</option>
                <option value="0-50000">€0 - €50K</option>
                <option value="50000-100000">€50K - €100K</option>
                <option value="100000-150000">€100K - €150K</option>
                <option value="150000+">€150K+</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label htmlFor="tenure" className="form-label">
                Tenure
              </label>
              <select
                id="tenure"
                name="tenure"
                value={filters.tenure}
                onChange={handleFilterChange}
                className="form-select"
              >
                <option value="">All Tenures</option>
                <option value="0-1">0-1 years</option>
                <option value="1-3">1-3 years</option>
                <option value="3-5">3-5 years</option>
                <option value="5+">5+ years</option>
              </select>
            </div>

            <div className="form-group mb-0 flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="adjustForJobEvaluation"
                  checked={filters.adjustForJobEvaluation}
                  onChange={handleFilterChange}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Adjust for Job Evaluation</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
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
              Calculating analysis...
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pay Gap */}
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-600 mb-2">Adjusted Pay Gap</p>
                <p className={`text-3xl font-bold ${getGapColor(results.analysis?.gapAnalysis?.adjustedGap || 0)}`}>
                  {results.analysis?.gapAnalysis?.adjustedGap?.toFixed(2)}%
                </p>
                <div className="mt-4">
                  <span
                    className={`badge ${
                      Math.abs(results.analysis?.gapAnalysis?.adjustedGap || 0) < 5
                        ? 'badge-success'
                        : Math.abs(results.analysis?.gapAnalysis?.adjustedGap || 0) < 10
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}
                  >
                    {results.complianceStatus === 'COMPLIANT'
                      ? 'Compliant'
                      : results.complianceStatus === 'REQUIRES_JUSTIFICATION'
                      ? 'Requires Justification'
                      : 'Critical'}
                  </span>
                </div>
              </div>
            </div>

            {/* Unadjusted Gap */}
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-600 mb-2">Unadjusted Pay Gap</p>
                <p className={`text-3xl font-bold ${getGapColor(results.analysis?.gapAnalysis?.unadjustedGap || 0)}`}>
                  {results.analysis?.gapAnalysis?.unadjustedGap?.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500 mt-2">Before job evaluation adjustment</p>
              </div>
            </div>

            {/* Statistical Significance */}
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-600 mb-2">Statistical Significance</p>
                <p className="text-lg font-bold text-gray-900">
                  {results.analysis?.statisticalSignificance?.significantAt95Confidence ? 'Yes' : 'No'}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  p-value: {results.analysis?.statisticalSignificance?.pValue?.toFixed(4)}
                </p>
              </div>
            </div>

            {/* Sample Size */}
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-600 mb-2">Sample Size</p>
                <p className="text-3xl font-bold text-gray-900">
                  {results.analysis?.employeeData?.total}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  M: {results.analysis?.employeeData?.maleCount} | F: {results.analysis?.employeeData?.femaleCount}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="card">
            <div className="card-header">
              <div className="flex gap-2 border-b border-gray-200 -mb-4 -mx-6 px-6">
                {(['overview', 'department', 'job', 'tenure'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 font-medium border-b-2 transition ${
                      activeTab === tab
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab === 'overview' && 'Overview'}
                    {tab === 'department' && 'By Department'}
                    {tab === 'job' && 'By Job Code'}
                    {tab === 'tenure' && 'By Tenure'}
                  </button>
                ))}
              </div>
            </div>

            <div className="card-body">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Gender Distribution */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Gender Distribution</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-gray-700">Male Employees</span>
                            <span className="text-sm font-bold text-gray-900">
                              {results.analysis?.employeeData?.maleCount} (€
                              {results.analysis?.employeeData?.maleAvgSalary?.toFixed(0)})
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${
                                  ((results.analysis?.employeeData?.maleCount || 0) /
                                    (results.analysis?.employeeData?.total || 1)) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-gray-700">Female Employees</span>
                            <span className="text-sm font-bold text-gray-900">
                              {results.analysis?.employeeData?.femaleCount} (€
                              {results.analysis?.employeeData?.femaleAvgSalary?.toFixed(0)})
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-pink-600 h-2 rounded-full"
                              style={{
                                width: `${
                                  ((results.analysis?.employeeData?.femaleCount || 0) /
                                    (results.analysis?.employeeData?.total || 1)) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        {(results.analysis?.employeeData?.otherCount || 0) > 0 && (
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm text-gray-700">Other</span>
                              <span className="text-sm font-bold text-gray-900">
                                {results.analysis?.employeeData?.otherCount} (€
                                {results.analysis?.employeeData?.otherAvgSalary?.toFixed(0)})
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gray-600 h-2 rounded-full"
                                style={{
                                  width: `${
                                    ((results.analysis?.employeeData?.otherCount || 0) /
                                      (results.analysis?.employeeData?.total || 1)) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Statistical Details */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Statistical Analysis</h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-600">T-Statistic</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {results.analysis?.statisticalSignificance?.tStatistic?.toFixed(4)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">P-Value</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {results.analysis?.statisticalSignificance?.pValue?.toFixed(6)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Confidence Level</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {results.analysis?.statisticalSignificance?.significantAt95Confidence ? '95%' : 'Not Significant'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {results.recommendations && results.recommendations.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Recommendations</h4>
                      <ul className="space-y-2">
                        {results.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-blue-800 flex gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* By Department Tab */}
              {activeTab === 'department' && results.analysis?.byDepartment && (
                <div className="space-y-4">
                  {results.analysis.byDepartment.length > 0 ? (
                    results.analysis.byDepartment.map((dept, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <button
                          onClick={() =>
                            setExpandedDetails(expandedDetails === `dept-${idx}` ? null : `dept-${idx}`)
                          }
                          className="w-full text-left flex justify-between items-center"
                        >
                          <div>
                            <h4 className="font-semibold text-gray-900">{dept.department}</h4>
                            <p className="text-xs text-gray-600 mt-1">
                              M: {dept.maleCount} | F: {dept.femaleCount}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className={`text-2xl font-bold ${getGapColor(dept.gap)}`}>
                              {dept.gap?.toFixed(2)}%
                            </p>
                            <span className={`text-gray-400 transition ${expandedDetails === `dept-${idx}` ? 'rotate-180' : ''}`}>
                              ▼
                            </span>
                          </div>
                        </button>

                        {expandedDetails === `dept-${idx}` && (
                          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Male Average Salary:</span>
                              <span className="font-semibold">€{dept.maleAvgSalary?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Female Average Salary:</span>
                              <span className="font-semibold">€{dept.femaleAvgSalary?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Difference:</span>
                              <span className="font-semibold">
                                €{(dept.maleAvgSalary - dept.femaleAvgSalary)?.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-center py-8">No data available for departments</p>
                  )}
                </div>
              )}

              {/* By Job Code Tab */}
              {activeTab === 'job' && results.analysis?.byJobCode && (
                <div className="space-y-4">
                  {results.analysis.byJobCode.length > 0 ? (
                    results.analysis.byJobCode.map((job, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <button
                          onClick={() => setExpandedDetails(expandedDetails === `job-${idx}` ? null : `job-${idx}`)}
                          className="w-full text-left flex justify-between items-center"
                        >
                          <div>
                            <h4 className="font-semibold text-gray-900">{job.jobCode}</h4>
                            <p className="text-xs text-gray-600 mt-1">
                              M: {job.maleCount} | F: {job.femaleCount}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className={`text-2xl font-bold ${getGapColor(job.gap)}`}>
                              {job.gap?.toFixed(2)}%
                            </p>
                            <span className={`text-gray-400 transition ${expandedDetails === `job-${idx}` ? 'rotate-180' : ''}`}>
                              ▼
                            </span>
                          </div>
                        </button>

                        {expandedDetails === `job-${idx}` && (
                          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Male Average Salary:</span>
                              <span className="font-semibold">€{job.maleAvgSalary?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Female Average Salary:</span>
                              <span className="font-semibold">€{job.femaleAvgSalary?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Difference:</span>
                              <span className="font-semibold">
                                €{(job.maleAvgSalary - job.femaleAvgSalary)?.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-center py-8">No data available for job codes</p>
                  )}
                </div>
              )}

              {/* By Tenure Tab */}
              {activeTab === 'tenure' && results.analysis?.byTenure && (
                <div className="space-y-4">
                  {results.analysis.byTenure.length > 0 ? (
                    results.analysis.byTenure.map((tenure, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold text-gray-900">{tenure.tenureRange}</h4>
                            <p className="text-xs text-gray-600 mt-1">{tenure.employeeCount} employees</p>
                          </div>
                          <p className={`text-2xl font-bold ${getGapColor(tenure.gap)}`}>
                            {tenure.gap?.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-center py-8">No data available for tenure</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {['MANAGER', 'HR_SPECIALIST', 'COMPLIANCE_OFFICER', 'CFO', 'ADMIN'].includes(role || '') && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
              </div>
              <div className="card-body">
                <div className="flex flex-wrap gap-3">
                  {results.complianceStatus === 'REQUIRES_JUSTIFICATION' && ['MANAGER', 'HR_SPECIALIST', 'COMPLIANCE_OFFICER', 'CFO', 'ADMIN'].includes(role || '') && (
                    <button
                      onClick={() => router.push('/justifications/submit')}
                      className="btn btn-primary"
                    >
                      Submit Justification
                    </button>
                  )}
                  <button onClick={loadAnalysis} className="btn btn-secondary" disabled={loading}>
                    Refresh Analysis
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="btn btn-secondary"
                  >
                    Print Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
