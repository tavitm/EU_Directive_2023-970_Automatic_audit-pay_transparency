import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/pages/_app';
import { useJobs } from '@/hooks/useApi';
import { useLanguage } from '@/utils/useLanguage';

interface Criterion {
  name: string;
  weight: number;
}

interface JobForm {
  jobCode: string;
  title: string;
  department: string;
  evaluationMethod: string;
  description: string;
  criteria: Criterion[];
  pointScaleMin: number;
  pointScaleMax: number;
}

export default function CreateJobPage() {
  const router = useRouter();
  const { role } = useAuth();
  const { createJob, loading, error: hookError } = useJobs();
  const { t } = useLanguage();
  const [error, setError] = useState<{ message: string } | null>(null);

  const [step, setStep] = useState<'basic' | 'criteria' | 'scale' | 'review' | 'created'>('basic');
  const [formData, setFormData] = useState<JobForm>({
    jobCode: '',
    title: '',
    department: '',
    evaluationMethod: 'Point-Factor Method',
    description: '',
    criteria: [
      { name: 'Education & Skills', weight: 0 },
      { name: 'Experience', weight: 0 },
      { name: 'Complexity', weight: 0 },
      { name: 'Accountability', weight: 0 },
    ],
    pointScaleMin: 100,
    pointScaleMax: 300,
  });
  const [createdJobId, setCreatedJobId] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Redirect if not authorized
  if (role && !['HR_SPECIALIST', 'ADMIN'].includes(role)) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="card-header bg-yellow-50 border-b border-yellow-200">
            <h2 className="text-lg font-semibold text-yellow-900">{t('jobs.accessRestricted')}</h2>
          </div>
          <div className="card-body">
            <p className="text-gray-700">
              {t('jobs.onlyHRCanCreate')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Scale') || name === 'pointScaleMin' || name === 'pointScaleMax' ? parseInt(value) || 0 : value,
    }));
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCriterionChange = (idx: number, field: string, value: string | number) => {
    const newCriteria = [...formData.criteria];
    if (field === 'weight') {
      newCriteria[idx] = { ...newCriteria[idx], weight: parseInt(value as string) || 0 };
    } else {
      newCriteria[idx] = { ...newCriteria[idx], [field]: value };
    }
    setFormData(prev => ({
      ...prev,
      criteria: newCriteria,
    }));
  };

  const validateStep = (currentStep: string): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 'basic') {
      if (!formData.jobCode.trim()) {
        errors.jobCode = t('jobs.jobCodeRequired');
      }
      if (!formData.title.trim()) {
        errors.title = t('jobs.jobTitleRequired');
      }
      if (!formData.department.trim()) {
        errors.department = t('jobs.departmentRequired');
      }
      if (!formData.description.trim()) {
        errors.description = t('jobs.descriptionRequired');
      }
    }

    if (currentStep === 'criteria') {
      const totalWeight = formData.criteria.reduce((sum, c) => sum + c.weight, 0);
      if (totalWeight !== 100) {
        errors.criteria = t('jobs.weightsMustSum').replace('{{weight}}', totalWeight.toString());
      }
      formData.criteria.forEach((c, idx) => {
        if (!c.name.trim()) {
          errors[`criterion-${idx}`] = t('jobs.criterionNameRequired');
        }
        if (c.weight < 0 || c.weight > 100) {
          errors[`weight-${idx}`] = t('jobs.weightBetween');
        }
      });
    }

    if (currentStep === 'scale') {
      if (formData.pointScaleMin < 0) {
        errors.pointScaleMin = t('jobs.minimumPointsGte');
      }
      if (formData.pointScaleMax <= formData.pointScaleMin) {
        errors.pointScaleMax = t('jobs.maximumPointsGreater');
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;

    if (step === 'basic') {
      setStep('criteria');
    } else if (step === 'criteria') {
      setStep('scale');
    } else if (step === 'scale') {
      setStep('review');
    }
  };

  const handleBack = () => {
    if (step === 'criteria') {
      setStep('basic');
    } else if (step === 'scale') {
      setStep('criteria');
    } else if (step === 'review') {
      setStep('scale');
    }
  };

  const handleSubmit = async () => {
    if (!validateStep('review')) return;

    setError(null);

    try {
      const result = await createJob(formData);
      if (result) {
        setCreatedJobId(result.jobId || 'JOB-' + Date.now());
        setStep('created');
      } else {
        setError({ message: t('errors.jobCreationFailed') });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errors.jobCreationFailed');
      setError({ message: errorMessage });
      console.error('Creation error:', err);
    }
  };

  const totalWeight = formData.criteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">{t('jobs.createJobTitle')}</h1>
          <p className="text-sm text-gray-600 mt-2">
            {t('jobs.defineJobEvaluation')}
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      {step !== 'created' && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              {(['basic', 'criteria', 'scale', 'review'] as const).map((s, idx) => (
                <React.Fragment key={s}>
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition ${
                        step === s
                          ? 'bg-blue-600 text-white'
                          : ['basic', 'criteria', 'scale', 'review'].indexOf(step) > idx
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {s === 'basic' && t('jobs.basicInfo')}
                      {s === 'criteria' && t('jobs.step2Title')}
                      {s === 'scale' && t('jobs.step3Title')}
                      {s === 'review' && t('jobs.review')}
                    </span>
                  </div>
                  {idx < 3 && <div className="flex-1 h-1 bg-gray-200 mx-4"></div>}
                </React.Fragment>
              ))}
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

      {/* Step 1: Basic Information */}
      {step === 'basic' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">{t('jobs.step1BasicInformation')}</h2>
            <p className="text-sm text-gray-600 mt-2">{t('jobs.defineJobPosition')}</p>
          </div>

          <div className="card-body space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="jobCode" className="form-label">
                  {t('jobs.jobCode')} *
                </label>
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
                <label htmlFor="title" className="form-label">
                  {t('jobs.jobTitle')} *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Senior Software Engineer"
                  className="form-input"
                />
                {formErrors.title && <p className="form-error">{formErrors.title}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <option value="">{t('jobs.selectDepartment')}</option>
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

              <div className="form-group">
                <label htmlFor="evaluationMethod" className="form-label">
                  {t('jobs.evaluationMethod')}
                </label>
                <select
                  id="evaluationMethod"
                  name="evaluationMethod"
                  value={formData.evaluationMethod}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="Point-Factor Method">{t('jobs.pointFactorMethod')}</option>
                  <option value="Market-Based">{t('jobs.marketBased')}</option>
                  <option value="Job Ranking">{t('jobs.jobRanking')}</option>
                  <option value="Factor Comparison">{t('jobs.factorComparison')}</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">
                {t('jobs.description')} *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder={t('jobs.jobDescriptionPlaceholder')}
                className="form-textarea"
                rows={4}
              ></textarea>
              {formErrors.description && <p className="form-error">{formErrors.description}</p>}
            </div>

            <div className="alert alert-info">
              <p className="font-medium">📋 {t('jobs.directionCompliance')}</p>
              <p className="text-sm mt-2">
                {t('jobs.directionComplianceMessage')}
              </p>
            </div>
          </div>

          <div className="card-footer flex gap-3">
            <button onClick={() => router.push('/jobs')} className="btn btn-secondary">
              {t('common.cancel')}
            </button>
            <button onClick={handleNext} disabled={loading} className="btn btn-primary">
              {t('common.next')}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Evaluation Criteria */}
      {step === 'criteria' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">{t('jobs.step2Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('jobs.step2Description')}
            </p>
          </div>

          <div className="card-body space-y-4">
            {formErrors.criteria && <p className="form-error">{formErrors.criteria}</p>}

            <div className="space-y-4">
              {formData.criteria.map((criterion, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group mb-0">
                      <label htmlFor={`criterion-name-${idx}`} className="form-label">
                        {t('jobs.criterionName')}
                      </label>
                      <input
                        id={`criterion-name-${idx}`}
                        type="text"
                        value={criterion.name}
                        onChange={e => handleCriterionChange(idx, 'name', e.target.value)}
                        className="form-input"
                      />
                      {formErrors[`criterion-${idx}`] && (
                        <p className="form-error">{formErrors[`criterion-${idx}`]}</p>
                      )}
                    </div>

                    <div className="form-group mb-0">
                      <label htmlFor={`criterion-weight-${idx}`} className="form-label">
                        {t('jobs.weight')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          id={`criterion-weight-${idx}`}
                          type="number"
                          min="0"
                          max="100"
                          value={criterion.weight}
                          onChange={e => handleCriterionChange(idx, 'weight', e.target.value)}
                          className="form-input"
                        />
                        <div className="flex items-center px-3 bg-gray-50 rounded-lg text-sm font-semibold text-gray-700 whitespace-nowrap">
                          {criterion.weight}%
                        </div>
                      </div>
                      {formErrors[`weight-${idx}`] && (
                        <p className="form-error">{formErrors[`weight-${idx}`]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex justify-between items-center">
                <p className="font-medium text-blue-900">{t('jobs.totalWeight')}</p>
                <p className={`text-2xl font-bold ${totalWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalWeight}%
                </p>
              </div>
              {totalWeight !== 100 && (
                <p className="text-sm text-blue-800 mt-2">
                  {t('jobs.weightsAdjustment').replace('{{weight}}', totalWeight.toString()).replace('{{adjust}}', (100 - totalWeight).toString())}
                </p>
              )}
            </div>
          </div>

          <div className="card-footer flex gap-3">
            <button onClick={handleBack} className="btn btn-secondary">
              {t('common.back')}
            </button>
            <button onClick={handleNext} disabled={loading} className="btn btn-primary">
              {t('common.next')}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Point Scale */}
      {step === 'scale' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">{t('jobs.step3Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">{t('jobs.step3Description')}</p>
          </div>

          <div className="card-body space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="pointScaleMin" className="form-label">
                  {t('jobs.minimumPoints')} *
                </label>
                <input
                  id="pointScaleMin"
                  name="pointScaleMin"
                  type="number"
                  min="0"
                  value={formData.pointScaleMin}
                  onChange={handleInputChange}
                  className="form-input"
                />
                {formErrors.pointScaleMin && <p className="form-error">{formErrors.pointScaleMin}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="pointScaleMax" className="form-label">
                  {t('jobs.maximumPoints')} *
                </label>
                <input
                  id="pointScaleMax"
                  name="pointScaleMax"
                  type="number"
                  value={formData.pointScaleMax}
                  onChange={handleInputChange}
                  className="form-input"
                />
                {formErrors.pointScaleMax && <p className="form-error">{formErrors.pointScaleMax}</p>}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-3">{t('jobs.pointScaleRange')}</p>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{formData.pointScaleMin}</p>
                  <p className="text-xs text-gray-600 mt-1">{t('jobs.minimum')}</p>
                </div>
                <div className="flex-1 h-1 bg-blue-600 rounded"></div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{formData.pointScaleMax}</p>
                  <p className="text-xs text-gray-600 mt-1">{t('jobs.maximum')}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3 text-center">
                {t('jobs.range')}: {formData.pointScaleMax - formData.pointScaleMin} points
              </p>
            </div>

            <div className="alert alert-info">
              <p className="font-medium">💡 {t('jobs.pointScaleGuidance')}</p>
              <p className="text-sm mt-2">
                {t('jobs.pointScaleGuidanceMessage')}
              </p>
            </div>
          </div>

          <div className="card-footer flex gap-3">
            <button onClick={handleBack} className="btn btn-secondary">
              {t('common.back')}
            </button>
            <button onClick={handleNext} disabled={loading} className="btn btn-primary">
              {t('jobs.review')}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 'review' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">{t('jobs.step4Title')}</h2>
              <p className="text-sm text-gray-600 mt-2">{t('jobs.step4Description')}</p>
            </div>

            <div className="card-body space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('jobs.basicInfo')}</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-600">{t('jobs.jobCode')}</p>
                      <p className="font-medium text-gray-900">{formData.jobCode}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t('jobs.jobTitle')}</p>
                      <p className="font-medium text-gray-900">{formData.title}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t('common.department')}</p>
                      <p className="font-medium text-gray-900">{formData.department}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t('jobs.evaluationMethod')}</p>
                      <p className="font-medium text-gray-900">{formData.evaluationMethod}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('jobs.pointScale')}</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-600">{t('jobs.minimum')}</p>
                      <p className="font-medium text-gray-900">{formData.pointScaleMin} points</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t('jobs.maximum')}</p>
                      <p className="font-medium text-gray-900">{formData.pointScaleMax} points</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t('jobs.range')}</p>
                      <p className="font-medium text-gray-900">{formData.pointScaleMax - formData.pointScaleMin} points</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">{t('jobs.evaluationCriteria')}</h3>
                <div className="space-y-2">
                  {formData.criteria.map((criterion, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{criterion.name}</span>
                      <span className="text-lg font-bold text-blue-600">{criterion.weight}%</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-lg font-semibold">
                    <span className="text-gray-900">{t('jobs.totalWeight')}</span>
                    <span className="text-blue-600">{totalWeight}%</span>
                  </div>
                </div>
              </div>

              {formData.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{t('jobs.description')}</h3>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                    {formData.description}
                  </p>
                </div>
              )}
            </div>

            <div className="card-footer flex gap-3">
              <button onClick={handleBack} className="btn btn-secondary">
                {t('common.back')}
              </button>
              <button onClick={handleSubmit} disabled={loading} className="btn btn-primary">
                {loading ? (
                  <>
                    <span className="spinner mr-2"></span>
                    {t('jobs.creating')}
                  </>
                ) : (
                  t('jobs.createJobTitle')
                )}
              </button>
            </div>
          </div>

          <div className="alert alert-info">
            <p className="font-medium">📋 {t('jobs.whatsHappensNext')}</p>
            <p className="text-sm mt-2">
              {t('jobs.nextStepsMessage')}
            </p>
          </div>
        </div>
      )}

      {/* Step 5: Created */}
      {step === 'created' && (
        <div className="card">
          <div className="card-header bg-green-50 border-b border-green-200">
            <h2 className="text-lg font-semibold text-green-900">✓ {t('jobs.jobCreated')}</h2>
          </div>

          <div className="card-body space-y-6">
            <div className="text-center py-4">
              <p className="text-4xl mb-4">✓</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('jobs.successfullyCreated')}</h3>
              <p className="text-gray-600">{t('jobs.jobCreatedDraft')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-xs text-blue-600 uppercase font-semibold">{t('jobs.jobID')}</p>
                <p className="text-lg font-bold text-blue-900 mt-1">{createdJobId}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-600 uppercase font-semibold">{t('jobs.jobTitle')}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{formData.title}</p>
              </div>
            </div>

            <div className="alert alert-success">
              <p className="font-medium">✓ {t('jobs.nextSteps')}</p>
              <p className="text-sm mt-2">
                {t('jobs.nextStepsDetail')}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="/jobs" className="btn btn-primary">
                {t('jobs.backToJobs')}
              </a>
              <button
                onClick={() => router.push(`/jobs/${createdJobId}/edit`)}
                className="btn btn-secondary"
              >
                {t('jobs.editJobEvaluation')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
