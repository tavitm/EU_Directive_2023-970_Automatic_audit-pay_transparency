import React, { useState } from 'react';
import { useEmployees } from '@/hooks/useApi';
import Papa from 'papaparse';

export default function EmployeeImportPage() {
  const { importEmployees, loading, error: apiError } = useEmployees();
  const [csvData, setCsvData] = useState<any[]>([]);
  const [preview, setPreview] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState<'upload' | 'preview' | 'confirm' | 'result'>('upload');
  const [result, setResult] = useState<any>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        if (results.errors.length > 0) {
          setError('Error parsing CSV file');
          return;
        }

        const data = results.data;

        // Validate required columns
        if (!data[0] || !data[0].employeeId || !data[0].salary) {
          setError(
            'CSV must contain columns: employeeId, firstName, lastName, salary, gender (M/F/O), department, jobCode'
          );
          return;
        }

        setCsvData(data);
        setPreview(data.slice(0, 10)); // Show first 10 rows
        setStep('preview');
      },
      error: (error: any) => {
        setError(`CSV parse error: ${error.message}`);
      },
    });
  };

  const handleImport = async () => {
    if (csvData.length === 0) {
      setError('No data to import');
      return;
    }

    setStep('confirm');
  };

  const handleConfirm = async () => {
    try {
      setError('');
      setSuccess('');

      // Validate data format
      const validated = csvData.map((row) => ({
        employeeId: row.employeeId?.trim(),
        firstName: row.firstName?.trim(),
        lastName: row.lastName?.trim(),
        salary: parseFloat(row.salary),
        gender: row.gender?.trim().toUpperCase(),
        department: row.department?.trim(),
        jobCode: row.jobCode?.trim(),
      }));

      // Check for missing required fields
      for (const emp of validated) {
        if (!emp.employeeId || !emp.salary || !emp.gender || !emp.department || !emp.jobCode) {
          setError(`Missing required fields in row: ${emp.employeeId}`);
          setStep('preview');
          return;
        }

        if (!['M', 'F', 'O'].includes(emp.gender)) {
          setError(`Invalid gender in row ${emp.employeeId}: ${emp.gender}`);
          setStep('preview');
          return;
        }

        if (emp.salary <= 0) {
          setError(`Invalid salary in row ${emp.employeeId}: ${emp.salary}`);
          setStep('preview');
          return;
        }
      }

      // Call API
      const apiResult = await importEmployees(validated);

      if (apiResult) {
        setResult(apiResult);
        setStep('result');
        setSuccess('Import completed successfully!');
      } else if (apiError) {
        setError(apiError.message);
        setStep('preview');
      }
    } catch (err: any) {
      setError(err.message || 'Import failed');
      setStep('preview');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">Employee Data Import</h1>
          <p className="text-sm text-gray-600 mt-2">
            Bulk import employee salary data with irreversible GDPR-compliant pseudonymization
          </p>
        </div>
      </div>

      {/* Warning Alert */}
      <div className="alert alert-warning">
        <p className="font-medium">⚠️ Important: Irreversible Pseudonymization</p>
        <p className="text-sm mt-1">
          When you import data, employee IDs, first names, and last names will be permanently deleted and replaced
          with irreversible SHA-256 hashes. This action cannot be undone. Ensure you have proper backups before
          proceeding.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="alert alert-success">
          <p className="font-medium">✓ Success</p>
          <p className="text-sm mt-1">{success}</p>
        </div>
      )}

      {/* Upload Step */}
      {step === 'upload' && (
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Upload CSV File</h2>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
              <div className="mb-4">
                <p className="text-4xl mb-2">📁</p>
                <p className="text-lg font-medium text-gray-900">Drag and drop CSV file here</p>
                <p className="text-sm text-gray-600 mt-2">or</p>
              </div>

              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csvFile"
              />
              <label htmlFor="csvFile" className="btn btn-primary cursor-pointer">
                Select File
              </label>

              <p className="text-xs text-gray-500 mt-4">CSV format required</p>
            </div>

            {/* CSV Format Help */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">CSV Format Requirements</h3>
              <p className="text-sm text-gray-700 mb-3">Your CSV file must have these columns (case-sensitive):</p>
              <div className="space-y-2 text-sm font-mono bg-white p-3 rounded border border-gray-200">
                <p>employeeId,firstName,lastName,salary,gender,department,jobCode</p>
                <p className="text-gray-600 pt-2">Example:</p>
                <p>EMP001,John,Doe,65000,M,Engineering,ENG-001</p>
                <p>EMP002,Jane,Smith,63000,F,Engineering,ENG-001</p>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                • Gender must be: M (male), F (female), or O (other)
                <br />
                • Salary must be a positive number
                <br />
                • All fields are required
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Step */}
      {step === 'preview' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Step 2: Preview Data</h2>
              <p className="text-sm text-gray-600 mt-1">Showing first 10 rows of {csvData.length} total</p>
            </div>
            <div className="space-x-2">
              <button className="btn btn-secondary" onClick={() => setStep('upload')}>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleImport} disabled={loading}>
                {loading ? 'Processing...' : 'Continue'}
              </button>
            </div>
          </div>

          <div className="card-body overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Employee ID</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Salary</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Gender</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Department</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Job Code</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{row.employeeId}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{`${row.firstName} ${row.lastName}`}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">€{parseFloat(row.salary).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.gender}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.department}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.jobCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Step */}
      {step === 'confirm' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Step 3: Confirm Import</h2>
          </div>

          <div className="card-body space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-medium text-red-900 mb-2">⚠️ Final Warning</p>
              <p className="text-sm text-red-800">
                You are about to import <strong>{csvData.length} employee records</strong>. This will:
              </p>
              <ul className="list-disc list-inside text-sm text-red-800 mt-2 space-y-1">
                <li>Permanently delete all employee IDs</li>
                <li>Permanently delete all first and last names</li>
                <li>Replace with irreversible SHA-256 hashes</li>
                <li>Store only pseudonymized data going forward</li>
              </ul>
              <p className="text-sm text-red-800 mt-2 font-medium">
                This action CANNOT be undone. Proceed only if you have verified backups.
              </p>
            </div>

            <div className="flex gap-4">
              <button className="btn btn-secondary" onClick={() => setStep('preview')}>
                Back
              </button>
              <button className="btn btn-danger" onClick={handleConfirm} disabled={loading}>
                {loading ? 'Importing...' : 'I Understand - Import Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Step */}
      {step === 'result' && result && (
        <div className="card">
          <div className="card-header bg-green-50 border-b border-green-200">
            <h2 className="text-lg font-semibold text-green-900">✓ Import Complete</h2>
          </div>

          <div className="card-body space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs text-green-600 uppercase font-semibold">Imported</p>
                <p className="text-2xl font-bold text-green-900">
                  {result.importSummary?.successfullyImported}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 uppercase font-semibold">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">
                  {result.importSummary?.totalRecords}
                </p>
              </div>
              {result.importSummary?.failedRecords > 0 && (
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-xs text-red-600 uppercase font-semibold">Failed</p>
                  <p className="text-2xl font-bold text-red-900">
                    {result.importSummary?.failedRecords}
                  </p>
                </div>
              )}
            </div>

            {/* Pseudonymization Report */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-medium text-blue-900 mb-3">Pseudonymization Report</p>
              <div className="space-y-2 text-sm text-blue-800">
                <p>Algorithm: <span className="font-medium">{result.pseudonymizationReport?.algorithm}</span></p>
                <p>
                  Fields Deleted:
                  <ul className="list-disc list-inside mt-1 ml-2">
                    <li>First Names: {result.pseudonymizationReport?.deletedFields?.firstNames}</li>
                    <li>Last Names: {result.pseudonymizationReport?.deletedFields?.lastNames}</li>
                    <li>Original IDs: {result.pseudonymizationReport?.deletedFields?.originalIds}</li>
                  </ul>
                </p>
                <p className="font-medium text-blue-900 mt-3">
                  ✓ Original identifiers have been PERMANENTLY DELETED and cannot be recovered.
                </p>
              </div>
            </div>

            {/* Compliance Note */}
            <div className="alert alert-success">
              <p className="font-medium">✓ GDPR Article 4(11) Compliant</p>
              <p className="text-sm mt-1">
                Employee data has been pseudonymized using irreversible SHA-256 hashing. Personal identifiers are
                permanently deleted per GDPR pseudonymization requirements.
              </p>
            </div>

            {/* Next Steps */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-2">Next Steps</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>Data is now available for gap analysis</li>
                <li>Visit Pay Gap Analysis to calculate gender pay gaps</li>
                <li>Submit justifications if gaps are identified</li>
                <li>Track corrective measures and compliance status</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <a href="/analysis" className="btn btn-primary">
                View Pay Gap Analysis
              </a>
              <a href="/dashboard" className="btn btn-secondary">
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
