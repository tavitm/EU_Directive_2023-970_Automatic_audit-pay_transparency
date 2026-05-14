import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/pages/_app';
import { useEmployees } from '@/hooks/useApi';
import { useLanguage } from '@/utils/useLanguage';

interface TransparencyResult {
  requestId?: string;
  peerGroup?: {
    jobCode: string;
    department: string;
    gender?: string;
    count: number;
    salaryStats?: {
      minimum: number;
      p25: number;
      median: number;
      p75: number;
      maximum: number;
      mean: number;
      stdDev: number;
    };
  };
  responseDeadline?: string;
  requestStatus?: 'SUBMITTED' | 'PROCESSING' | 'COMPLETED';
}

export default function TransparencyPage() {
  const router = useRouter();
  const { role } = useAuth();
  const { requestTransparency, loading, error } = useEmployees();
  const { t } = useLanguage();

  const [step, setStep] = useState<'form' | 'preview' | 'submitted'>('form');
  const [formData, setFormData] = useState({
    jobCode: '',
    department: '',
    includeGender: false,
  });
  const [results, setResults] = useState<TransparencyResult | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Redirect if not an employee
  if (role && role !== 'EMPLOYEE') {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="card-header bg-yellow-50 border-b border-yellow-200">
            <h2 className="text-lg font-semibold text-yellow-900">{t('transparency.accessRestricted')}</h2>
          </div>
          <div className="card-body">
            <p className="text-gray-700 mb-4">
              {t('transparency.onlyEmployeesCanAccess')}
            </p>
            <p className="text-sm text-gray-600">
              {t('transparency.managersHRCanAccess')}{' '}
              <button onClick={() => router.push('/analysis')} className="text-blue-600 hover:underline">
                {t('transparency.analysisPage')}
              </button>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.jobCode.trim()) {
      errors.jobCode = t('transparency.jobCodeRequired');
    }

    if (!formData.department.trim()) {
      errors.department = t('transparency.departmentRequired');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setStep('preview');
  };

  const handleConfirm = async () => {
    try {
      const result = await requestTransparency(
        formData.jobCode,
        formData.department,
        formData.includeGender ? 'F' : undefined
      );

      if (result) {
        setResults(result);
        setStep('submitted');
      }
    } catch (err) {
      console.error('Request error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">{t('transparency.title')}</h1>
          <p className="text-sm text-gray-600 mt-2">
            {t('transparency.requestSalaryInfo')}
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <div className="alert alert-info">
        <p className="font-medium">{t('transparency.privacyProtected')}</p>
        <p className="text-sm mt-2">
          {t('transparency.privacyMessage')}
        </p>
      </div>

      {/* Form Step */}
      {step === 'form' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">{t('transparency.step1ProvideInfo')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('transparency.provideInfoDescription')}
            </p>
          </div>

          <div className="card-body space-y-6">
            <div className="form-group">
              <label htmlFor="jobCode" className="form-label">
                {t('transparency.jobCode')} *
              </label>
              <p className="text-xs text-gray-600 mb-2">
                {t('transparency.enterYourJobCode')}
              </p>
              <input
                id="jobCode"
                name="jobCode"
                type="text"
                value={formData.jobCode}
                onChange={handleInputChange}
                placeholder="e.g., ENG-001"
                className="form-input"
              />
              {formErrors.jobCode && <p className="form-error">{formErrors.jobCode}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="department" className="form-label">
                {t('common.department')} *
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">{t('transparency.selectYourDepartment')}</option>
                <option value="Engineering">{t('common.engineering')}</option>
                <option value="Sales">{t('common.sales')}</option>
                <option value="Marketing">{t('common.marketing')}</option>
                <option value="Operations">{t('common.operations')}</option>
                <option value="Finance">{t('common.finance')}</option>
                <option value="HR">{t('common.humanResources')}</option>
                <option value="Legal">{t('common.legal')}</option>
                <option value="Executive">{t('common.executive')}</option>
              </select>
              {formErrors.department && <p className="form-error">{formErrors.department}</p>}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="includeGender"
                  checked={formData.includeGender}
                  onChange={handleInputChange}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-gray-900">{t('transparency.includeGender')}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {t('transparency.genderAnalysisDescription')}
                  </p>
                </div>
              </label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-medium text-blue-900 mb-2">📋 {t('transparency.whatYouReceive')}:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• {t('transparency.salaryStatsDescription')}</li>
                <li>• {t('transparency.minimumPeerGroup')}</li>
                <li>• {t('transparency.noIndividualData')}</li>
                <li>• {t('transparency.response15Days')}</li>
              </ul>
            </div>
          </div>

          <div className="card-footer flex gap-3">
            <button onClick={() => router.push('/dashboard')} className="btn btn-secondary">
              {t('common.cancel')}
            </button>
            <button onClick={handleSubmit} disabled={loading} className="btn btn-primary">
              {t('common.next')}
            </button>
          </div>
        </div>
      )}

      {/* Preview Step */}
      {step === 'preview' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">{t('transparency.step2ReviewRequest')}</h2>
            <p className="text-sm text-gray-600 mt-2">{t('transparency.reviewRequestDescription')}</p>
          </div>

          <div className="card-body space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">{t('transparency.requestSummary')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">{t('transparency.jobCode')}</p>
                  <p className="font-semibold text-gray-900">{formData.jobCode}</p>
                </div>
                <div>
                  <p className="text-gray-600">{t('transparency.yourDepartment')}</p>
                  <p className="font-semibold text-gray-900">{formData.department}</p>
                </div>
                <div>
                  <p className="text-gray-600">{t('common.filter')}</p>
                  <p className="font-semibold text-gray-900">
                    {formData.includeGender ? t('transparency.includeGender') : t('common.allDepartments')}
                  </p>
                </div>
              </div>
            </div>

            <div className="alert alert-warning">
              <p className="font-medium">⏱️ {t('common.time')}</p>
              <p className="text-sm mt-2">
                {t('transparency.response15Days')}
              </p>
            </div>

            <div className="alert alert-info">
              <p className="font-medium">📊 {t('transparency.minimumPeerGroup')}</p>
              <p className="text-sm mt-2">
                {t('transparency.minimumPeerGroup')}
              </p>
            </div>
          </div>

          <div className="card-footer flex gap-3">
            <button onClick={() => setStep('form')} className="btn btn-secondary">
              {t('common.back')}
            </button>
            <button onClick={handleConfirm} disabled={loading} className="btn btn-primary">
              {loading ? (
                <>
                  <span className="spinner mr-2"></span>
                  {t('common.submit')}
                </>
              ) : (
                t('transparency.requestSubmitted')
              )}
            </button>
          </div>
        </div>
      )}

      {/* Submitted Step */}
      {step === 'submitted' && results && (
        <div className="card">
          <div className="card-header bg-green-50 border-b border-green-200">
            <h2 className="text-lg font-semibold text-green-900">✓ {t('transparency.requestSubmitted')}</h2>
          </div>

          <div className="card-body space-y-6">
            <div className="text-center py-4">
              <p className="text-4xl mb-4">✓</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('common.success')}</h3>
              <p className="text-gray-600">{t('transparency.requestSubmitted')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-xs text-blue-600 uppercase font-semibold">{t('transparency.requestID')}</p>
                <p className="text-lg font-bold text-blue-900 mt-1">{results.requestId || 'TR-2026-05-14-001'}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-600 uppercase font-semibold">{t('transparency.responseDeadline')}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {results.responseDeadline || '2026-05-29'}
                </p>
              </div>
            </div>

            {results.peerGroup && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">{t('transparency.peerGroupStatistics')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">{t('transparency.jobCode')}</p>
                    <p className="font-semibold text-gray-900">{results.peerGroup.jobCode}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t('common.department')}</p>
                    <p className="font-semibold text-gray-900">{results.peerGroup.department}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t('transparency.peerGroupCount')}</p>
                    <p className="font-semibold text-gray-900">{results.peerGroup.count}</p>
                  </div>
                </div>

                {results.peerGroup.salaryStats && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">{t('transparency.salaryStats')}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">{t('transparency.minimum')}</p>
                        <p className="font-semibold text-gray-900">
                          €{results.peerGroup.salaryStats.minimum.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t('transparency.percentile25')}</p>
                        <p className="font-semibold text-gray-900">
                          €{results.peerGroup.salaryStats.p25.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t('transparency.median')}</p>
                        <p className="font-semibold text-gray-900">
                          €{results.peerGroup.salaryStats.median.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t('transparency.percentile75')}</p>
                        <p className="font-semibold text-gray-900">
                          €{results.peerGroup.salaryStats.p75.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t('transparency.maximum')}</p>
                        <p className="font-semibold text-gray-900">
                          €{results.peerGroup.salaryStats.maximum.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t('transparency.mean')}</p>
                        <p className="font-semibold text-gray-900">
                          €{results.peerGroup.salaryStats.mean.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t('transparency.standardDeviation')}</p>
                        <p className="font-semibold text-gray-900">
                          €{results.peerGroup.salaryStats.stdDev.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="alert alert-success">
              <p className="font-medium">✓ {t('transparency.whatsNext')}</p>
              <p className="text-sm mt-2">
                {t('transparency.whatsNextMessage')}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="/dashboard" className="btn btn-primary">
                {t('transparency.backToDashboard')}
              </a>
              <button onClick={() => window.print()} className="btn btn-secondary">
                {t('transparency.printRequest')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <p className="font-medium">{t('common.error')}</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      )}
    </div>
  );
}
