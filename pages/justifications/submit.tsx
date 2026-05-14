import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/pages/_app';
import { useJustifications } from '@/hooks/useApi';

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
      label: 'Job Level Distribution',
      description: 'Difference in male/female distribution across job levels',
    },
    {
      id: 'salary_progression',
      label: 'Salary Progression Differences',
      description: 'Variations in career progression or raise patterns',
    },
    {
      id: 'tenure_related',
      label: 'Tenure-Related Differences',
      description: 'Pay gaps attributed to differences in tenure',
    },
    {
      id: 'role_performance',
      label: 'Role or Performance Differences',
      description: 'Pay gaps due to role-specific factors or performance metrics',
    },
    {
      id: 'education_qualifications',
      label: 'Education & Qualifications',
      description: 'Differences in education levels or certifications',
    },
    {
      id: 'other',
      label: 'Other',
      description: 'Other business-related factors',
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
      errors.gapSelection = 'Please select a gap category';
    }

    if (currentStep === 'details') {
      if (!formData.affectedGroups.trim()) {
        errors.affectedGroups = 'Please describe affected groups';
      }
      if (!formData.rootCause.trim()) {
        errors.rootCause = 'Please explain the root cause';
      }
      if (!formData.explanation.trim()) {
        errors.explanation = 'Please provide a detailed explanation';
      }
    }

    if (currentStep === 'measures') {
      if (!formData.correctiveMeasures.trim()) {
        errors.correctiveMeasures = 'Please describe corrective measures';
      }
      if (!formData.implementationTimeline.trim()) {
        errors.implementationTimeline = 'Please specify implementation timeline';
      }
      if (!formData.expectedOutcome.trim()) {
        errors.expectedOutcome = 'Please describe expected outcome';
      }
      if (!formData.quantifiableTargets.trim()) {
        errors.quantifiableTargets = 'Please set quantifiable targets';
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
          <h1 className="text-2xl font-bold text-gray-900">Submit Pay Gap Justification</h1>
          <p className="text-sm text-gray-600 mt-2">
            Explain identified pay gaps and describe corrective measures per EU Directive 2023/970
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
                      {s === 'select' && 'Select Gap'}
                      {s === 'details' && 'Gap Details'}
                      {s === 'measures' && 'Corrective Measures'}
                      {s === 'review' && 'Review'}
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
          <p className="font-medium">Submission Error</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      )}

      {/* Step 1: Select Gap Category */}
      {step === 'select' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Step 1: Select Gap Category</h2>
            <p className="text-sm text-gray-600 mt-2">Which category best describes the identified pay gap?</p>
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
              Cancel
            </button>
            <button onClick={handleNext} className="btn btn-primary">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Gap Details */}
      {step === 'details' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Step 2: Gap Details</h2>
            <p className="text-sm text-gray-600 mt-2">
              Category: {gapCategories.find(c => c.id === gapSelection)?.label}
            </p>
          </div>

          <div className="card-body space-y-6">
            <div className="form-group">
              <label htmlFor="affectedGroups" className="form-label">
                Affected Groups
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Describe which groups are affected (e.g., "Male vs Female employees in Engineering")
              </p>
              <textarea
                id="affectedGroups"
                name="affectedGroups"
                value={formData.affectedGroups}
                onChange={handleInputChange}
                placeholder="E.g., Female engineers have lower average salary compared to male engineers..."
                className="form-textarea"
                rows={3}
              ></textarea>
              {formErrors.affectedGroups && <p className="form-error">{formErrors.affectedGroups}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="rootCause" className="form-label">
                Root Cause Analysis
              </label>
              <p className="text-xs text-gray-600 mb-2">
                What factors contribute to this pay gap?
              </p>
              <textarea
                id="rootCause"
                name="rootCause"
                value={formData.rootCause}
                onChange={handleInputChange}
                placeholder="E.g., Different distribution of employees across job levels, experience requirements, work patterns..."
                className="form-textarea"
                rows={3}
              ></textarea>
              {formErrors.rootCause && <p className="form-error">{formErrors.rootCause}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="explanation" className="form-label">
                Detailed Explanation
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Provide comprehensive justification for the identified pay gap
              </p>
              <textarea
                id="explanation"
                name="explanation"
                value={formData.explanation}
                onChange={handleInputChange}
                placeholder="Provide detailed analysis supporting your justification..."
                className="form-textarea"
                rows={4}
              ></textarea>
              {formErrors.explanation && <p className="form-error">{formErrors.explanation}</p>}
            </div>
          </div>

          <div className="card-footer flex gap-3">
            <button onClick={handleBack} className="btn btn-secondary">
              Back
            </button>
            <button onClick={handleNext} disabled={loading} className="btn btn-primary">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Corrective Measures */}
      {step === 'measures' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Step 3: Corrective Measures</h2>
            <p className="text-sm text-gray-600 mt-2">
              Describe planned actions to address the identified pay gap
            </p>
          </div>

          <div className="card-body space-y-6">
            <div className="form-group">
              <label htmlFor="correctiveMeasures" className="form-label">
                Corrective Measures
              </label>
              <p className="text-xs text-gray-600 mb-2">
                What specific actions will be taken to address this gap?
              </p>
              <textarea
                id="correctiveMeasures"
                name="correctiveMeasures"
                value={formData.correctiveMeasures}
                onChange={handleInputChange}
                placeholder="E.g., Salary adjustments, career development programs, changed recruitment criteria..."
                className="form-textarea"
                rows={3}
              ></textarea>
              {formErrors.correctiveMeasures && (
                <p className="form-error">{formErrors.correctiveMeasures}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="implementationTimeline" className="form-label">
                Implementation Timeline
              </label>
              <p className="text-xs text-gray-600 mb-2">
                When will these measures be implemented?
              </p>
              <textarea
                id="implementationTimeline"
                name="implementationTimeline"
                value={formData.implementationTimeline}
                onChange={handleInputChange}
                placeholder="E.g., Phase 1 (Q2 2026): Salary reviews, Phase 2 (Q3 2026): Career development program launch..."
                className="form-textarea"
                rows={3}
              ></textarea>
              {formErrors.implementationTimeline && (
                <p className="form-error">{formErrors.implementationTimeline}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="expectedOutcome" className="form-label">
                Expected Outcome
              </label>
              <p className="text-xs text-gray-600 mb-2">
                What is the expected impact of these measures?
              </p>
              <textarea
                id="expectedOutcome"
                name="expectedOutcome"
                value={formData.expectedOutcome}
                onChange={handleInputChange}
                placeholder="E.g., Reduction of pay gap from 8% to 3% within 12 months..."
                className="form-textarea"
                rows={3}
              ></textarea>
              {formErrors.expectedOutcome && <p className="form-error">{formErrors.expectedOutcome}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="quantifiableTargets" className="form-label">
                Quantifiable Targets
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Set specific, measurable goals for addressing the gap
              </p>
              <textarea
                id="quantifiableTargets"
                name="quantifiableTargets"
                value={formData.quantifiableTargets}
                onChange={handleInputChange}
                placeholder="E.g., Target: Reduce adjusted gap to &lt;5% by Q4 2026, Increase female representation in senior roles to 40% by end of 2027..."
                className="form-textarea"
                rows={3}
              ></textarea>
              {formErrors.quantifiableTargets && (
                <p className="form-error">{formErrors.quantifiableTargets}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="documentationUrl" className="form-label">
                Supporting Documentation URL (Optional)
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Link to supporting documents or analysis
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
              Back
            </button>
            <button onClick={handleNext} disabled={loading} className="btn btn-primary">
              Review
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 'review' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Step 4: Review Justification</h2>
              <p className="text-sm text-gray-600 mt-2">
                Please review your justification before submitting
              </p>
            </div>

            <div className="card-body space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Gap Category</h3>
                <p className="text-gray-700">
                  {gapCategories.find(c => c.id === formData.gapCategory)?.label}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Affected Groups</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{formData.affectedGroups}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Root Cause Analysis</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{formData.rootCause}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Detailed Explanation</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{formData.explanation}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Corrective Measures</h4>
                  <p className="text-blue-800 text-sm whitespace-pre-wrap">{formData.correctiveMeasures}</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Implementation Timeline</h4>
                  <p className="text-blue-800 text-sm whitespace-pre-wrap">{formData.implementationTimeline}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">Expected Outcome</h4>
                  <p className="text-green-800 text-sm whitespace-pre-wrap">{formData.expectedOutcome}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">Quantifiable Targets</h4>
                  <p className="text-green-800 text-sm whitespace-pre-wrap">{formData.quantifiableTargets}</p>
                </div>
              </div>

              {formData.documentationUrl && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Supporting Documentation</h3>
                  <a href={formData.documentationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                    {formData.documentationUrl}
                  </a>
                </div>
              )}
            </div>

            <div className="card-footer flex gap-3">
              <button onClick={handleBack} className="btn btn-secondary">
                Back
              </button>
              <button onClick={handleSubmit} disabled={loading} className="btn btn-primary">
                {loading ? (
                  <>
                    <span className="spinner mr-2"></span>
                    Submitting...
                  </>
                ) : (
                  'Submit Justification'
                )}
              </button>
            </div>
          </div>

          <div className="alert alert-info">
            <p className="font-medium">Submission Process</p>
            <p className="text-sm mt-2">
              Your justification will be submitted for review through a multi-stage approval process:
            </p>
            <ol className="list-decimal list-inside text-sm mt-2 space-y-1">
              <li>Manager review and approval</li>
              <li>HR Specialist verification</li>
              <li>Compliance Officer final approval</li>
            </ol>
          </div>
        </div>
      )}

      {/* Step 5: Submitted */}
      {step === 'submitted' && (
        <div className="card">
          <div className="card-header bg-green-50 border-b border-green-200">
            <h2 className="text-lg font-semibold text-green-900">✓ Justification Submitted</h2>
          </div>

          <div className="card-body space-y-6">
            <div className="text-center py-4">
              <p className="text-4xl mb-4">✓</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Submission Successful</h3>
              <p className="text-gray-600">
                Your pay gap justification has been submitted for review
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-xs text-blue-600 uppercase font-semibold">Submission ID</p>
                <p className="text-lg font-bold text-blue-900 mt-1">{submissionId}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-600 uppercase font-semibold">Status</p>
                <p className="text-lg font-bold text-gray-900 mt-1">Awaiting Manager Review</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="font-medium text-yellow-900 mb-2">⏱️ Approval Timeline</p>
              <p className="text-sm text-yellow-800">
                Your justification will proceed through the following stages:
              </p>
              <ol className="list-decimal list-inside text-sm text-yellow-800 mt-2 space-y-1">
                <li>
                  <strong>Manager Review</strong> (typically 3-5 business days)
                </li>
                <li>
                  <strong>HR Verification</strong> (typically 5-7 business days)
                </li>
                <li>
                  <strong>Compliance Officer Approval</strong> (typically 7-10 business days)
                </li>
              </ol>
            </div>

            <div className="alert alert-success">
              <p className="font-medium">✓ Next Steps</p>
              <p className="text-sm mt-2">
                You will receive email notifications at each approval stage. You can track the status of your
                justification in the Justifications dashboard.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="/justifications" className="btn btn-primary">
                View Justifications
              </a>
              <a href="/dashboard" className="btn btn-secondary">
                Back to Dashboard
              </a>
              <button onClick={() => window.print()} className="btn btn-secondary">
                Print Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
