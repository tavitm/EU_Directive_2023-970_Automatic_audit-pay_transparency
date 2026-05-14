import React, { useEffect } from 'react';
import { useAuth } from '@/pages/_app';
import { useReports, useAnalysis } from '@/hooks/useApi';

export default function DashboardPage() {
  const { user, role } = useAuth();
  const { getComplianceReport, loading: reportLoading, data: report } = useReports();
  const { calculateGap, loading: gapLoading, data: gapData } = useAnalysis();

  useEffect(() => {
    getComplianceReport();
    calculateGap();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card">
        <div className="card-body">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.email}!
          </h1>
          <p className="text-gray-600">
            Role: <span className="font-medium">{role}</span>
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Overall Pay Gap */}
        <MetricCard
          title="Overall Pay Gap"
          value={gapData?.analysis?.gapAnalysis?.adjustedGap || '-'}
          unit="%"
          status={getGapStatus(gapData?.analysis?.gapAnalysis?.adjustedGap)}
          icon="📈"
          loading={gapLoading}
        />

        {/* Employees Analyzed */}
        <MetricCard
          title="Employees Analyzed"
          value={gapData?.analysis?.employeeData?.total || 0}
          status="info"
          icon="👥"
          loading={gapLoading}
        />

        {/* Compliance Status */}
        <MetricCard
          title="Compliance Status"
          value={report?.report?.overallComplianceAssessment?.status || '-'}
          status={getComplianceStatus(report?.report?.overallComplianceAssessment?.status)}
          icon="✅"
          loading={reportLoading}
        />

        {/* Active Jobs */}
        <MetricCard
          title="Active Job Methodologies"
          value={report?.report?.jobEvaluationMethodology?.methodologiesActive || 0}
          status="info"
          icon="💼"
          loading={reportLoading}
        />
      </div>

      {/* Pay Gap Details */}
      {gapData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gender Distribution */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Gender Distribution</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Male Employees</span>
                    <span className="text-sm font-bold text-gray-900">
                      {gapData.analysis?.employeeData?.maleCount} ({gapData.analysis?.employeeData?.maleAvgSalary} €)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (gapData.analysis?.employeeData?.maleCount /
                            gapData.analysis?.employeeData?.total) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Female Employees</span>
                    <span className="text-sm font-bold text-gray-900">
                      {gapData.analysis?.employeeData?.femaleCount} ({gapData.analysis?.employeeData?.femaleAvgSalary} €)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-pink-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (gapData.analysis?.employeeData?.femaleCount /
                            gapData.analysis?.employeeData?.total) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                {gapData.analysis?.employeeData?.otherCount > 0 && (
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Other</span>
                      <span className="text-sm font-bold text-gray-900">
                        {gapData.analysis?.employeeData?.otherCount}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gray-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (gapData.analysis?.employeeData?.otherCount /
                              gapData.analysis?.employeeData?.total) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statistical Significance */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Statistical Analysis</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <p className="text-sm text-gray-600">Pay Gap (Adjusted)</p>
                <p className="text-3xl font-bold text-gray-900">
                  {gapData.analysis?.gapAnalysis?.adjustedGap}%
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">T-Statistic</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {gapData.analysis?.statisticalSignificance?.tStatistic}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">P-Value</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {gapData.analysis?.statisticalSignificance?.pValue}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Significance Level</p>
                <span
                  className={`badge ${
                    gapData.analysis?.statisticalSignificance?.significantAt95Confidence
                      ? 'badge-warning'
                      : 'badge-success'
                  }`}
                >
                  {gapData.analysis?.statisticalSignificance?.significantAt95Confidence
                    ? 'Significant at 95% confidence'
                    : 'Not significant'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {role === 'EMPLOYEE' && (
              <ActionButton
                href="/transparency"
                label="Request Pay Transparency"
                icon="🔍"
              />
            )}

            {['MANAGER', 'HR_SPECIALIST', 'COMPLIANCE_OFFICER', 'ADMIN'].includes(role) && (
              <>
                <ActionButton href="/analysis" label="View Pay Gap" icon="📈" />
                <ActionButton href="/justifications" label="Manage Justifications" icon="📋" />
              </>
            )}

            {['HR_SPECIALIST', 'COMPLIANCE_OFFICER', 'ADMIN'].includes(role) && (
              <>
                <ActionButton href="/employees/import" label="Import Data" icon="📥" />
                <ActionButton href="/jobs" label="Job Evaluations" icon="💼" />
              </>
            )}

            {['COMPLIANCE_OFFICER', 'ADMIN'].includes(role) && (
              <>
                <ActionButton href="/reports" label="Compliance Reports" icon="📊" />
                <ActionButton href="/audit" label="Audit Trail" icon="📋" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Compliance Note */}
      <div className="alert alert-info">
        <p className="font-medium">🔒 GDPR & Directive 2023/970 Compliant</p>
        <p className="text-sm mt-1">
          All data is pseudonymized using SHA-256 hashing. Employee identities are protected per GDPR Article 4(11).
          Complete audit trail is maintained for all operations (Directive Article 15).
        </p>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  unit = '',
  status = 'info',
  icon,
  loading,
}: {
  title: string;
  value: any;
  unit?: string;
  status?: string;
  icon: string;
  loading?: boolean;
}) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">
              {loading ? <span className="spinner"></span> : `${value}${unit}`}
            </p>
          </div>
          <span className="text-3xl">{icon}</span>
        </div>
        <div className="mt-4">
          <span className={`badge badge-${status}`}>{status}</span>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <a
      href={href}
      className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
    >
      <p className="text-3xl mb-2">{icon}</p>
      <p className="text-sm font-medium text-gray-900">{label}</p>
    </a>
  );
}

function getGapStatus(gap: number): string {
  if (gap === undefined || gap === null) return 'info';
  if (Math.abs(gap) < 5) return 'success';
  if (Math.abs(gap) < 10) return 'warning';
  return 'danger';
}

function getComplianceStatus(status: string): string {
  if (status === 'COMPLIANT') return 'success';
  if (status === 'REQUIRES_JUSTIFICATION') return 'warning';
  if (status === 'CRITICAL') return 'danger';
  return 'info';
}
