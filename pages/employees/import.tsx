import React, { useState } from 'react';
import { useEmployees } from '@/hooks/useApi';
import { useLanguage } from '@/utils/useLanguage';
import Papa from 'papaparse';

export default function EmployeeImportPage() {
  const { importEmployees, loading, error: apiError } = useEmployees();
  const { t } = useLanguage();
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
      dynamicTyping: false,
      complete: (results: any) => {
        if (results.errors.length > 0) {
          setError(t('employees.errorParsingCSV'));
          return;
        }

        const data = results.data;

        // Check if data is empty
        if (!data || data.length === 0) {
          setError(t('employees.csvMustContainColumns'));
          return;
        }

        // Get first row and check for required columns
        const firstRow = data[0];
        const requiredColumns = ['employeeId', 'firstName', 'lastName', 'salary', 'gender', 'department', 'jobCode'];
        const hasRequiredColumns = requiredColumns.every(col => col in firstRow);

        // Check if it might be semicolon-delimited (common issue)
        if (!hasRequiredColumns && firstRow && Object.keys(firstRow).length <= 2) {
          const firstKey = Object.keys(firstRow)[0];
          if (firstKey && firstKey.includes(';')) {
            setError('❌ ' + t('employees.csvMustContainColumns') + '\n\n' +
              '⚠️ Notă: Fișierul pare să folosească PUNCT-VIRGULĂ (;) ca delimitator.\n' +
              'Exportați din Excel/Calc cu delimitatorul VIRGULĂ (,)');
            return;
          }
        }

        // Check if header row is missing (data values instead of column names)
        if (!hasRequiredColumns && firstRow && Object.keys(firstRow).length === 7) {
          const firstKey = Object.keys(firstRow)[0];
          // If first column looks like employee data (not a column header), likely missing header
          if (firstKey && !['employeeId', 'id', 'employee', 'emp', 'cod', 'nr'].some(h => h.toLowerCase() === firstKey.toLowerCase())) {
            setError('❌ ' + t('employees.csvMustContainColumns') + '\n\n' +
              '⚠️ Notă: CSV-ul pare să LIPSEASCĂ LINIA DE ANTET (header row)!\n' +
              'Prima linie trebuie să conțină NUMELE COLOANELOR:\n' +
              'employeeId,firstName,lastName,salary,gender,department,jobCode\n\n' +
              'După aceea urmează datele cu angajații.');
            return;
          }
        }

        if (!hasRequiredColumns) {
          setError('❌ ' + t('employees.csvMustContainColumns') + '\n\n' +
            '✅ Coloanele necesare sunt:\n' +
            'employeeId, firstName, lastName, salary, gender (M/F/O), department, jobCode');
          return;
        }

        setCsvData(data);
        setPreview(data.slice(0, 10)); // Show first 10 rows
        setStep('preview');
      },
      error: (error: any) => {
        setError(t('employees.csvParseError').replace('{{error}}', error.message));
      },
    });
  };

  const handleImport = async () => {
    if (csvData.length === 0) {
      setError(t('employees.noDataToImport'));
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
          setError(t('employees.missingRequiredFields').replace('{{id}}', emp.employeeId));
          setStep('preview');
          return;
        }

        if (!['M', 'F', 'O'].includes(emp.gender)) {
          setError(t('employees.invalidGender').replace('{{id}}', emp.employeeId).replace('{{gender}}', emp.gender));
          setStep('preview');
          return;
        }

        if (emp.salary <= 0) {
          setError(t('employees.invalidSalary').replace('{{id}}', emp.employeeId).replace('{{salary}}', emp.salary.toString()));
          setStep('preview');
          return;
        }
      }

      // Call API
      const apiResult = await importEmployees(validated);

      if (apiResult) {
        setResult(apiResult);
        setStep('result');
        setSuccess(t('employees.importCompleted'));
      } else if (apiError) {
        setError(apiError.message);
        setStep('preview');
      }
    } catch (err: any) {
      setError(err.message || t('employees.importFailed'));
      setStep('preview');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">{t('employees.importTitle')}</h1>
          <p className="text-sm text-gray-600 mt-2">
            {t('employees.bulkImportDescription')}
          </p>
        </div>
      </div>

      {/* Warning Alert */}
      <div className="alert alert-warning">
        <p className="font-medium">{t('employees.irreversiblePseudonymization')}</p>
        <p className="text-sm mt-1">
          {t('employees.pseudonymizationWarning')}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <p className="font-medium">{t('common.error')}</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="alert alert-success">
          <p className="font-medium">✓ {t('common.success')}</p>
          <p className="text-sm mt-1">{success}</p>
        </div>
      )}

      {/* Upload Step */}
      {step === 'upload' && (
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('employees.step1UploadCSV')}</h2>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
              <div className="mb-4">
                <p className="text-4xl mb-2">📁</p>
                <p className="text-lg font-medium text-gray-900">{t('employees.dragDropCSV')}</p>
                <p className="text-sm text-gray-600 mt-2">{t('common.or')}</p>
              </div>

              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csvFile"
              />
              <label htmlFor="csvFile" className="btn btn-primary cursor-pointer">
                {t('employees.selectFile')}
              </label>

              <p className="text-xs text-gray-500 mt-4">{t('employees.csvFormatRequired')}</p>
            </div>

            {/* CSV Format Help */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">{t('employees.csvFormatRequirements')}</h3>
              <p className="text-sm text-gray-700 mb-3">{t('employees.csvMustHaveColumns')}</p>
              <div className="space-y-2 text-sm font-mono bg-white p-3 rounded border border-gray-200">
                <p>employeeId,firstName,lastName,salary,gender,department,jobCode</p>
                <p className="text-gray-600 pt-2">{t('employees.exampleCSV')}</p>
                <p>EMP001,John,Doe,65000,M,Engineering,ENG-001</p>
                <p>EMP002,Jane,Smith,63000,F,Engineering,ENG-001</p>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                {t('employees.genderMust')}
                <br />
                {t('employees.salaryMustBePositive')}
                <br />
                {t('employees.allFieldsRequired')}
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
              <h2 className="text-lg font-semibold text-gray-900">{t('employees.step2PreviewData')}</h2>
              <p className="text-sm text-gray-600 mt-1">{t('employees.showingFirstRows').replace('{{total}}', csvData.length.toString())}</p>
            </div>
            <div className="space-x-2">
              <button className="btn btn-secondary" onClick={() => setStep('upload')}>
                {t('common.back')}
              </button>
              <button className="btn btn-primary" onClick={handleImport} disabled={loading}>
                {loading ? t('employees.processing') : t('employees.continue')}
              </button>
            </div>
          </div>

          <div className="card-body overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">{t('employees.employeeID')}</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">{t('employees.name')}</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">{t('employees.salary')}</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">{t('employees.gender')}</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">{t('employees.department')}</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">{t('employees.jobCode')}</th>
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
            <h2 className="text-lg font-semibold text-gray-900">{t('employees.step3ConfirmImport')}</h2>
          </div>

          <div className="card-body space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-medium text-red-900 mb-2">⚠️ {t('common.finalWarning')}</p>
              <p className="text-sm text-red-800">
                {t('employees.aboutToImport').replace('{{count}}', csvData.length.toString())}
              </p>
              <ul className="list-disc list-inside text-sm text-red-800 mt-2 space-y-1">
                <li>{t('employees.deleteEmployeeIDs')}</li>
                <li>{t('employees.deleteNames')}</li>
                <li>{t('employees.replaceWithHashes')}</li>
                <li>{t('employees.storeOnlyPseudonymized')}</li>
              </ul>
              <p className="text-sm text-red-800 mt-2 font-medium">
                {t('employees.cannotBeUndone')}
              </p>
            </div>

            <div className="flex gap-4">
              <button className="btn btn-secondary" onClick={() => setStep('preview')}>
                {t('common.back')}
              </button>
              <button className="btn btn-danger" onClick={handleConfirm} disabled={loading}>
                {loading ? t('employees.importing') : t('employees.iUnderstandImport')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Step */}
      {step === 'result' && result && (
        <div className="card">
          <div className="card-header bg-green-50 border-b border-green-200">
            <h2 className="text-lg font-semibold text-green-900">✓ {t('employees.importCompleted')}</h2>
          </div>

          <div className="card-body space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs text-green-600 uppercase font-semibold">{t('employees.imported')}</p>
                <p className="text-2xl font-bold text-green-900">
                  {result.importSummary?.successfullyImported}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 uppercase font-semibold">{t('employees.totalRecords')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {result.importSummary?.totalRecords}
                </p>
              </div>
              {result.importSummary?.failedRecords > 0 && (
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-xs text-red-600 uppercase font-semibold">{t('employees.failed')}</p>
                  <p className="text-2xl font-bold text-red-900">
                    {result.importSummary?.failedRecords}
                  </p>
                </div>
              )}
            </div>

            {/* Pseudonymization Report */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-medium text-blue-900 mb-3">{t('employees.pseudonymizationReport')}</p>
              <div className="space-y-2 text-sm text-blue-800">
                <p>{t('employees.algorithm')}: <span className="font-medium">{result.pseudonymizationReport?.algorithm}</span></p>
                <p>
                  {t('employees.fieldsDeleted')}:
                  <ul className="list-disc list-inside mt-1 ml-2">
                    <li>{t('employees.firstNames')}: {result.pseudonymizationReport?.deletedFields?.firstNames}</li>
                    <li>{t('employees.lastNames')}: {result.pseudonymizationReport?.deletedFields?.lastNames}</li>
                    <li>{t('employees.originalIDs')}: {result.pseudonymizationReport?.deletedFields?.originalIds}</li>
                  </ul>
                </p>
                <p className="font-medium text-blue-900 mt-3">
                  ✓ {t('employees.identifiersPermanentlyDeleted')}
                </p>
              </div>
            </div>

            {/* Compliance Note */}
            <div className="alert alert-success">
              <p className="font-medium">✓ {t('employees.gdprCompliant')}</p>
              <p className="text-sm mt-1">
                {t('employees.pseudonymizationCompliant')}
              </p>
            </div>

            {/* Next Steps */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-2">{t('employees.nextSteps')}</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>{t('employees.dataAvailableForAnalysis')}</li>
                <li>{t('employees.visitPayGapAnalysis')}</li>
                <li>{t('employees.submitJustifications')}</li>
                <li>{t('employees.trackCorrective')}</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <a href="/analysis" className="btn btn-primary">
                {t('employees.viewPayGapAnalysis')}
              </a>
              <a href="/dashboard" className="btn btn-secondary">
                {t('transparency.backToDashboard')}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
