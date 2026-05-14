import React, { useEffect } from 'react';
import { useAuth } from '@/pages/_app';
import { useLanguage } from '@/utils/useLanguage';
import { useReports, useAnalysis } from '@/hooks/useApi';

export default function DashboardPage() {
  const { user, role } = useAuth();
  const { t } = useLanguage();
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
            {t('dashboard.welcome')}, {user?.email}!
          </h1>
          <p className="text-gray-600">
            {t('dashboard.role')}: <span className="font-medium">{role}</span>
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Overall Pay Gap */}
        <MetricCard
          title={t('dashboard.overallPayGap')}
          value={gapData?.analysis?.gapAnalysis?.adjustedGap || '-'}
          unit="%"
          status={getGapStatus(gapData?.analysis?.gapAnalysis?.adjustedGap)}
          icon="📈"
          loading={gapLoading}
        />

        {/* Employees Analyzed */}
        <MetricCard
          title={t('dashboard.employeesAnalyzed')}
          value={gapData?.analysis?.employeeData?.total || 0}
          status="info"
          icon="👥"
          loading={gapLoading}
        />

        {/* Compliance Status */}
        <MetricCard
          title={t('dashboard.complianceStatus')}
          value={report?.report?.overallComplianceAssessment?.status || '-'}
          status={getComplianceStatus(report?.report?.overallComplianceAssessment?.status)}
          icon="✅"
          loading={reportLoading}
        />

        {/* Active Jobs */}
        <MetricCard
          title={t('dashboard.activeJobMethodologies')}
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
              <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.genderDistribution')}</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{t('dashboard.maleEmployees')}</span>
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
                    <span className="text-sm font-medium text-gray-700">{t('dashboard.femaleEmployees')}</span>
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
                      <span className="text-sm font-medium text-gray-700">{t('dashboard.other')}</span>
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
              <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.statisticalAnalysis')}</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <p className="text-sm text-gray-600">{t('dashboard.payGapAdjusted')}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {gapData.analysis?.gapAnalysis?.adjustedGap}%
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">{t('dashboard.tStatistic')}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {gapData.analysis?.statisticalSignificance?.tStatistic}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{t('dashboard.pValue')}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {gapData.analysis?.statisticalSignificance?.pValue}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">{t('dashboard.significanceLevel')}</p>
                <span
                  className={`badge ${
                    gapData.analysis?.statisticalSignificance?.significantAt95Confidence
                      ? 'badge-warning'
                      : 'badge-success'
                  }`}
                >
                  {gapData.analysis?.statisticalSignificance?.significantAt95Confidence
                    ? t('dashboard.significantAt95Confidence')
                    : t('dashboard.notSignificant')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.quickActions')}</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {role === 'EMPLOYEE' && (
              <ActionButton
                href="/transparency"
                label={t('dashboard.requestPayTransparency')}
                icon="🔍"
              />
            )}

            {['MANAGER', 'HR_SPECIALIST', 'COMPLIANCE_OFFICER', 'ADMIN'].includes(role) && (
              <>
                <ActionButton href="/analysis" label={t('dashboard.viewPayGap')} icon="📈" />
                <ActionButton href="/justifications" label={t('dashboard.manageJustifications')} icon="📋" />
              </>
            )}

            {['HR_SPECIALIST', 'COMPLIANCE_OFFICER', 'ADMIN'].includes(role) && (
              <>
                <ActionButton href="/employees/import" label={t('dashboard.importData')} icon="📥" />
                <ActionButton href="/jobs" label={t('dashboard.jobEvaluations')} icon="💼" />
              </>
            )}

            {['COMPLIANCE_OFFICER', 'ADMIN'].includes(role) && (
              <>
                <ActionButton href="/reports" label={t('dashboard.complianceReports')} icon="📊" />
                <ActionButton href="/audit" label={t('dashboard.auditTrail')} icon="📋" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Compliance Note */}
      <div className="alert alert-info">
        <p className="font-medium">🔒 {t('dashboard.gdprCompliant')}</p>
        <p className="text-sm mt-1">
          {t('dashboard.dataProtection')}
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
