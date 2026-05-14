import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/pages/_app';
import { useJustifications } from '@/hooks/useApi';
import { useLanguage } from '@/utils/useLanguage';

interface JustificationForm {
  gapCategory: string;
  affectedGroups: string;
  rootCause: string;
  explanation: string;
  correctiveMeasures: string;
  implementationTimeline: string;
  expectedOutcome: string;
  quantifiableTargets: string;
  documentationUrl?: string;
}

export default function JustificationSubmitPage() {
  const router = useRouter();
  const { role } = useAuth();
  const { submitJustification, loading, error } = useJustifications();
  const { t } = useLanguage();

  const [step, setStep] = useState<'select' | 'details' | 'measures' | 'review' | 'submitted'>('select');
  const [gapSelection, setGapSelection] = useState('');
  const [formData, setFormData] = useState<JustificationForm>({
    gapCategory: '',
    affectedGroups: '',
    rootCause: '',
    explanation: '',
    correctiveMeasures: '',
    implementationTimeline: '',
    expectedOutcome: '',
    quantifiableTargets: '',
  });
  const [submissionId, setSubmissionId] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Redirect if not authorized
  useEffect(() => {
    if (role && !['MANAGER', 'HR_SPECIALIST', 'COMPLIANCE_OFFICER', 'CFO', 'ADMIN'].includes(role)) {
      router.push('/dashboard');
    }
  }, [role]);

  const gapCategories = [
    {
      id: 'job_level_distribution',
      label: t('justifications.gapCategory.jobLevelDistribution.label'),
      description: t('justifications.gapCategory.jobLevelDistribution.description'),
    },
    {
      id: 'salary_progression',
      label: t('justifications.gapCategory.salaryProgression.label'),
      description: t('justifications.gapCategory.salaryProgression.description'),
    },
    {
      id: 'tenure_related',
      label: t('justifications.gapCategory.tenureRelated.label'),
      description: t('justifications.gapCategory.tenureRelated.description'),
    },
    {
      id: 'role_performance',
      label: t('justifications.gapCategory.rolePerformance.label'),
      description: t('justifications.gapCategory.rolePerformance.description'),
    },
    {
      id: 'education_qualifications',
      label: t('justifications.gapCategory.education.label'),
      description: t('justifications.gapCategory.education.description'),
    },
    {
      id: 'other',
      label: t('justifications.gapCategory.other.label'),
      description: t('justifications.gapCategory.other.description'),
    },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateStep = (currentStep: string): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 'select' && !gapSelection) {
      errors.gapSelection = t('justifications.validation.selectGapCategory');
    }

    if (currentStep === 'details') {
      if (!formData.affectedGroups.trim()) {
        errors.affectedGroups = t('justifications.validation.describeAffectedGroups');
      }
      if (!formData.rootCause.trim()) {
        errors.rootCause = t('justifications.validation.explainRootCause');
      }
      if (!formData.explanation.trim()) {
        errors.explanation = t('justifications.validation.provideDetailedExplanation');
      }
    }

    if (currentStep === 'measures') {
      if (!formData.correctiveMeasures.trim()) {
        errors.correctiveMeasures = t('justifications.validation.describeCorrectiveMeasures');
      }
      if (!formData.implementationTimeline.trim()) {
        errors.implementationTimeline = t('justifications.validation.specifyImplementationTimeline');
      }
      if (!formData.expectedOutcome.trim()) {
        errors.expectedOutcome = t('justifications.validation.describeExpectedOutcome');
      }
      if (!formData.quantifiableTargets.trim()) {
        errors.quantifiableTargets = t('justifications.validation.setQuantifiableTargets');
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;

    if (step === 'select') {
      setFormData(prev => ({
        ...prev,
        gapCategory: gapSelection,
      }));
      setStep('details');
    } else if (step === 'details') {
      setStep('measures');
    } else if (step === 'measures') {
      setStep('review');
    }
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('select');
    } else if (step === 'measures') {
      setStep('details');
    } else if (step === 'review') {
      setStep('measures');
    }
  };

  const handleSubmit = async () => {
    if (!validateStep('review')) return;

    try {
      const result = await submitJustification(formData);
      if (result) {
        setSubmissionId(result.justificationId || 'submitted');
        setStep('submitted');
      }
    } catch (err) {
      console.error('Submission error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">{t('justifications.submit.title')}</h1>
          <p className="text-sm text-gray-600 mt-2">
            {t('justifications.submit.description')}
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      {step !== 'submitted' && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              {['select', 'details', 'measures', 'review'].map((s, idx) => (
                <React.Fragment key={s}>
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition ${
                        step === s
                          ? 'bg-blue-600 text-white'
                          : ['select', 'details', 'measures', 'review'].indexOf(step) > idx
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {s === 'select' && t('justifications.submit.step.selectGap')}
                      {s === 'details' && t('justifications.submit.step.gapDetails')}
                      {s === 'measures' && t('justifications.submit.step.correctiveMeasures')}
                      {s === 'review' && t('justifications.submit.step.review')}
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
          <p className="font-medium">{t('justifications.submit.error')}</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      )}

      {/* Step 1: Select Gap Category */}
      {step === 'select' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">{t('justifications.submit.step1Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">{t('justifications.submit.step1Description')}</p>
          </div>

          <div className="card-body space-y-3">
            {gapCategories.map(category => (
              <label
                key={category.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                  gapSelection === category.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="gapCategory"
                    value={category.id}
                    checked={gapSelection === category.id}
                    onChange={e => setGapSelection(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{category.label}</p>
                    <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  </div>
                </div>
              </label>
            ))}

            {formErrors.gapSelection && (
              <p className="form-error">{formErrors.gapSelection}</p>
            )}
          </div>

          <div className="card-footer flex gap-3">
            <button onClick={() => router.push('/analysis')} className="btn btn-secondary">
              {t('common.cancel')}
            </button>
            <button onClick={handleNext} className="btn btn-primary">
              {t('common.continue')}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Gap Details */}
      {step === 'details' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">{t('justifications.submit.step2Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('justifications.submit.category')}: {gapCategories.find(c => c.id === gapSelection)?.label}
            </p>
          </div>

          <div className="card-body space-y-6">
            <div className="form-group">
              <label htmlFor="affectedGroups" className="form-label">
                {t('justifications.submit.affectedGroups')}
              </label>
              <p className="text-xs text-gray-600 mb-2">
                {t('justifications.submit.affectedGroupsHelper')}
              </p>
              <textarea
                id="affectedGroups"
                name="affectedGroups"
                value={formData.affectedGroups}
                onChange={handleInputChange}
                placeholder={t('justifications.submit.affectedGroupsPlaceholder')}
                className="form-textarea"
                rows={3}
              ></textarea>
              {formErrors.affectedGroups && <p className="form-error">{formErrors.affectedGroups}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="rootCause" className="form-label">
                {t('justifications.submit.rootCauseAnalysis')}
              </label>
              <p className="text-xs text-gray-600 mb-2">
                {t('justifications.submit.rootCauseHelper')}
              </p>
              <textarea
                id="rootCause"
                name="rootCause"
                value={formData.rootCause}
                onChange={handleInputChange}
                placeholder={t('justifications.submit.rootCausePlaceholder')}
                className="form-textarea"
                rows={3}
              ></textarea>
              {formErrors.rootCause && <p className="form-error">{formErrors.rootCause}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="explanation" className="form-label">
                {t('justifications.submit.detailedExplanation')}
              </label>
              <p className="text-xs text-gray-600 mb-2">
                {t('justifications.submit.detailedExplanationHelper')}
              </p>
              <textarea
                id="explanation"
                name="explanation"
                value={formData.explanation}
                onChange={handleInputChange}
                placeholder={t('justifications.submit.detailedExplanationPlaceholder')}
                className="form-textarea"
                rows={4}
              ></textarea>
              {formErrors.explanation && <p className="form-error">{formErrors.explanation}</p>}
            </div>
          </div>

          <div className="card-footer flex gap-3">
            <button onClick={handleBack} className="btn btn-secondary">
              {t('common.back')}
            </button>
            <button onClick={handleNext} disabled={loading} className="btn btn-primary">
              {t('common.continue')}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Corrective Measures */}
      {step === 'measures' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">{t('justifications.submit.step3Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('justifications.submit.step3Description')}
            </p>
          </div>

          <div className="card-body space-y-6">
            <div className="form-group">
              <label htmlFor="correctiveMeasures" className="form-label">
                {t('justifications.submit.correctiveMeasures')}
              </label>
              <p className="text-xs text-gray-600 mb-2">
                {t('justifications.submit.correctiveMeasuresHelper')}
              </p>
              <textarea
                id="correctiveMeasures"
                name="correctiveMeasures"
                value={formData.correctiveMeasures}
                onChange={handleInputChange}
                placeholder={t('justifications.submit.correctiveMeasuresPlaceholder')}
                className="form-textarea"
                rows={3}
              ></textarea>
              {formErrors.correctiveMeasures && (
                <p className="form-error">{formErrors.correctiveMeasures}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="implementationTimeline" className="form-label">
                {t('justifications.submit.implementationTimeline')}
              </label>
              <p className="text-xs text-gray-600 mb-2">
                {t('justifications.submit.implementationTimelineHelper')}
              </p>
              <textarea
                id="implementationTimeline"
                name="implementationTimeline"
                value={formData.implementationTimeline}
                onChange={handleInputChange}
                placeholder={t('justifications.submit.implementationTimelinePlaceholder')}
                className="form-textarea"
                rows={3}
              ></textarea>
              {formErrors.implementationTimeline && (
                <p className="form-error">{formErrors.implementationTimeline}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="expectedOutcome" className="form-label">
                {t('justifications.submit.expectedOutcome')}
              </label>
              <p className="text-xs text-gray-600 mb-2">
                {t('justifications.submit.expectedOutcomeHelper')}
              </p>
              <textarea
                id="expectedOutcome"
                name="expectedOutcome"
                value={formData.expectedOutcome}
                onChange={handleInputChange}
                placeholder={t('justifications.submit.expectedOutcomePlaceholder')}
                className="form-textarea"
                rows={3}
              ></textarea>
              {formErrors.expectedOutcome && <p className="form-error">{formErrors.expectedOutcome}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="quantifiableTargets" className="form-label">
                {t('justifications.submit.quantifiableTargets')}
              </label>
              <p className="text-xs text-gray-600 mb-2">
                {t('justifications.submit.quantifiableTargetsHelper')}
              </p>
              <textarea
                id="quantifiableTargets"
                name="quantifiableTargets"
                value={formData.quantifiableTargets}
                onChange={handleInputChange}
                placeholder={t('justifications.submit.quantifiableTargetsPlaceholder')}
                className="form-textarea"
                rows={3}
              ></textarea>
              {formErrors.quantifiableTargets && (
                <p className="form-error">{formErrors.quantifiableTargets}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="documentationUrl" className="form-label">
                {t('justifications.submit.supportingDocumentation')}
              </label>
              <p className="text-xs text-gray-600 mb-2">
                {t('justifications.submit.supportingDocumentationHelper')}
              </p>
              <input
                id="documentationUrl"
                name="documentationUrl"
                type="url"
                value={formData.documentationUrl || ''}
                onChange={handleInputChange}
                placeholder="https://..."
                className="form-input"
              />
            </div>
          </div>

          <div className="card-footer flex gap-3">
            <button onClick={handleBack} className="btn btn-secondary">
              {t('common.back')}
            </button>
            <button onClick={handleNext} disabled={loading} className="btn btn-primary">
              {t('justifications.submit.review')}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 'review' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">{t('justifications.submit.step4Title')}</h2>
              <p className="text-sm text-gray-600 mt-2">
                {t('justifications.submit.step4Description')}
              </p>
            </div>

            <div className="card-body space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{t('justifications.submit.review.gapCategory')}</h3>
                <p className="text-gray-700">
                  {gapCategories.find(c => c.id === formData.gapCategory)?.label}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{t('justifications.submit.review.affectedGroups')}</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{formData.affectedGroups}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{t('justifications.submit.review.rootCauseAnalysis')}</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{formData.rootCause}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{t('justifications.submit.review.detailedExplanation')}</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{formData.explanation}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">{t('justifications.submit.review.correctiveMeasures')}</h4>
                  <p className="text-blue-800 text-sm whitespace-pre-wrap">{formData.correctiveMeasures}</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">{t('justifications.submit.review.implementationTimeline')}</h4>
                  <p className="text-blue-800 text-sm whitespace-pre-wrap">{formData.implementationTimeline}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">{t('justifications.submit.review.expectedOutcome')}</h4>
                  <p className="text-green-800 text-sm whitespace-pre-wrap">{formData.expectedOutcome}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">{t('justifications.submit.review.quantifiableTargets')}</h4>
                  <p className="text-green-800 text-sm whitespace-pre-wrap">{formData.quantifiableTargets}</p>
                </div>
              </div>

              {formData.documentationUrl && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('justifications.submit.review.supportingDocumentation')}</h3>
                  <a href={formData.documentationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                    {formData.documentationUrl}
                  </a>
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
                    {t('justifications.submit.submitting')}
                  </>
                ) : (
                  t('justifications.submit.submitJustification')
                )}
              </button>
            </div>
          </div>

          <div className="alert alert-info">
            <p className="font-medium">{t('justifications.submit.submissionProcess')}</p>
            <p className="text-sm mt-2">
              {t('justifications.submit.submissionProcessDescription')}
            </p>
            <ol className="list-decimal list-inside text-sm mt-2 space-y-1">
              <li>{t('justifications.submit.managerReview')}</li>
              <li>{t('justifications.submit.hrVerification')}</li>
              <li>{t('justifications.submit.complianceApproval')}</li>
            </ol>
          </div>
        </div>
      )}

      {/* Step 5: Submitted */}
      {step === 'submitted' && (
        <div className="card">
          <div className="card-header bg-green-50 border-b border-green-200">
            <h2 className="text-lg font-semibold text-green-900">✓ {t('justifications.submit.success.title')}</h2>
          </div>

          <div className="card-body space-y-6">
            <div className="text-center py-4">
              <p className="text-4xl mb-4">✓</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('justifications.submit.success.successTitle')}</h3>
              <p className="text-gray-600">
                {t('justifications.submit.success.successDescription')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-xs text-blue-600 uppercase font-semibold">{t('justifications.submit.success.submissionId')}</p>
                <p className="text-lg font-bold text-blue-900 mt-1">{submissionId}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-600 uppercase font-semibold">{t('justifications.submit.success.status')}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{t('justifications.submit.success.awaitingManagerReview')}</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="font-medium text-yellow-900 mb-2">⏱️ {t('justifications.submit.success.approvalTimeline')}</p>
              <p className="text-sm text-yellow-800">
                {t('justifications.submit.success.timelineDescription')}
              </p>
              <ol className="list-decimal list-inside text-sm text-yellow-800 mt-2 space-y-1">
                <li>
                  <strong>{t('justifications.submit.success.managerReviewLabel')}</strong> ({t('justifications.submit.success.managerReviewTime')})
                </li>
                <li>
                  <strong>{t('justifications.submit.success.hrVerificationLabel')}</strong> ({t('justifications.submit.success.hrVerificationTime')})
                </li>
                <li>
                  <strong>{t('justifications.submit.success.complianceApprovalLabel')}</strong> ({t('justifications.submit.success.complianceApprovalTime')})
                </li>
              </ol>
            </div>

            <div className="alert alert-success">
              <p className="font-medium">✓ {t('justifications.submit.success.nextStepsLabel')}</p>
              <p className="text-sm mt-2">
                {t('justifications.submit.success.nextStepsDescription')}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="/justifications" className="btn btn-primary">
                {t('justifications.submit.success.viewJustifications')}
              </a>
              <a href="/dashboard" className="btn btn-secondary">
                {t('justifications.submit.success.backToDashboard')}
              </a>
              <button onClick={() => window.print()} className="btn btn-secondary">
                {t('justifications.submit.success.printSubmission')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
