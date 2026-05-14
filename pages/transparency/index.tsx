import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/pages/_app';
import { useEmployees } from '@/hooks/useApi';

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
            <h2 className="text-lg font-semibold text-yellow-900">Access Restricted</h2>
          </div>
          <div className="card-body">
            <p className="text-gray-700 mb-4">
              This page is only available to employees. If you are an employee, please log in with your employee account.
            </p>
            <p className="text-sm text-gray-600">
              Managers and HR can access pay gap analysis through the{' '}
              <button onClick={() => router.push('/analysis')} className="text-blue-600 hover:underline">
                Analysis page
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
      errors.jobCode = 'Please enter your job code';
    }

    if (!formData.department.trim()) {
      errors.department = 'Please select your department';
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
          <h1 className="text-2xl font-bold text-gray-900">Pay Transparency Request</h1>
          <p className="text-sm text-gray-600 mt-2">
            Request salary information for your peer group per EU Directive 2023/970
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <div className="alert alert-info">
        <p className="font-medium">🔒 Your Privacy is Protected</p>
        <p className="text-sm mt-2">
          We will provide you with aggregated salary statistics for employees in similar roles. Individual salary
          information will never be disclosed. All data is pseudonymized and you cannot be identified.
        </p>
      </div>

      {/* Form Step */}
      {step === 'form' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Step 1: Provide Your Information</h2>
            <p className="text-sm text-gray-600 mt-2">
              We will use this to identify your peer group and provide relevant salary statistics
            </p>
          </div>

          <div className="card-body space-y-6">
            <div className="form-group">
              <label htmlFor="jobCode" className="form-label">
                Your Job Code *
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Your job code as shown in your employment contract (e.g., ENG-001, SAL-003)
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
                Your Department *
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">Select your department</option>
                <option value="Engineering">Engineering</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
                <option value="Finance">Finance</option>
                <option value="HR">Human Resources</option>
                <option value="Legal">Legal</option>
                <option value="Executive">Executive</option>
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
                  <p className="font-medium text-gray-900">Compare with same gender peers</p>
                  <p className="text-xs text-gray-600 mt-1">
                    If checked, we'll provide salary statistics only for employees of the same gender. This can help
                    you understand gender-based salary differences (optional).
                  </p>
                </div>
              </label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-medium text-blue-900 mb-2">📋 What you'll receive:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Salary statistics for your peer group (minimum, quartiles, maximum, average)</li>
                <li>• Number of employees in your peer group (minimum 10 required)</li>
                <li>• No individual salary data or identifying information</li>
                <li>• Response within 15 days (per Directive Article 10)</li>
              </ul>
            </div>
          </div>

          <div className="card-footer flex gap-3">
            <button onClick={() => router.push('/dashboard')} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading} className="btn btn-primary">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Preview Step */}
      {step === 'preview' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Step 2: Confirm Your Request</h2>
            <p className="text-sm text-gray-600 mt-2">Please review your request details</p>
          </div>

          <div className="card-body space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Your Peer Group</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Job Code</p>
                  <p className="font-semibold text-gray-900">{formData.jobCode}</p>
                </div>
                <div>
                  <p className="text-gray-600">Department</p>
                  <p className="font-semibold text-gray-900">{formData.department}</p>
                </div>
                <div>
                  <p className="text-gray-600">Filter</p>
                  <p className="font-semibold text-gray-900">
                    {formData.includeGender ? 'Same Gender' : 'All Genders'}
                  </p>
                </div>
              </div>
            </div>

            <div className="alert alert-warning">
              <p className="font-medium">⏱️ Processing Time</p>
              <p className="text-sm mt-2">
                Your request will be processed within 15 days per EU Directive 2023/970, Article 10. You will receive
                an email notification when your salary statistics are ready.
              </p>
            </div>

            <div className="alert alert-info">
              <p className="font-medium">📊 Minimum Group Size</p>
              <p className="text-sm mt-2">
                We can only provide statistics if your peer group contains at least 10 employees. If your group is
                smaller, we cannot fulfill this request to protect privacy.
              </p>
            </div>
          </div>

          <div className="card-footer flex gap-3">
            <button onClick={() => setStep('form')} className="btn btn-secondary">
              Back
            </button>
            <button onClick={handleConfirm} disabled={loading} className="btn btn-primary">
              {loading ? (
                <>
                  <span className="spinner mr-2"></span>
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Submitted Step */}
      {step === 'submitted' && results && (
        <div className="card">
          <div className="card-header bg-green-50 border-b border-green-200">
            <h2 className="text-lg font-semibold text-green-900">✓ Request Submitted</h2>
          </div>

          <div className="card-body space-y-6">
            <div className="text-center py-4">
              <p className="text-4xl mb-4">✓</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Successful</h3>
              <p className="text-gray-600">Your transparency request has been submitted</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-xs text-blue-600 uppercase font-semibold">Request ID</p>
                <p className="text-lg font-bold text-blue-900 mt-1">{results.requestId || 'TR-2026-05-14-001'}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-600 uppercase font-semibold">Response Deadline</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {results.responseDeadline || '2026-05-29'}
                </p>
              </div>
            </div>

            {results.peerGroup && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Your Peer Group</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Job Code</p>
                    <p className="font-semibold text-gray-900">{results.peerGroup.jobCode}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Department</p>
                    <p className="font-semibold text-gray-900">{results.peerGroup.department}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Peer Count</p>
                    <p className="font-semibold text-gray-900">{results.peerGroup.count}</p>
                  </div>
                </div>

                {results.peerGroup.salaryStats && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Salary Statistics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Minimum</p>
                        <p className="font-semibold text-gray-900">
                          €{results.peerGroup.salaryStats.minimum.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">25th Percentile</p>
                        <p className="font-semibold text-gray-900">
                          €{results.peerGroup.salaryStats.p25.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Median</p>
                        <p className="font-semibold text-gray-900">
                          €{results.peerGroup.salaryStats.median.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">75th Percentile</p>
                        <p className="font-semibold text-gray-900">
                          €{results.peerGroup.salaryStats.p75.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Maximum</p>
                        <p className="font-semibold text-gray-900">
                          €{results.peerGroup.salaryStats.maximum.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Average</p>
                        <p className="font-semibold text-gray-900">
                          €{results.peerGroup.salaryStats.mean.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Std. Deviation</p>
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
              <p className="font-medium">✓ What's Next</p>
              <p className="text-sm mt-2">
                We'll process your request and send you the salary statistics by email. If your peer group contains
                fewer than 10 employees, we'll notify you that we cannot provide the information to protect privacy.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="/dashboard" className="btn btn-primary">
                Back to Dashboard
              </a>
              <button onClick={() => window.print()} className="btn btn-secondary">
                Print Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      )}
    </div>
  );
}
