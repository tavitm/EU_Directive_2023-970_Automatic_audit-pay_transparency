import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/pages/_app';
import { useLanguage } from '@/utils/useLanguage';
import { adminApi } from '@/utils/apiClient';

interface CorrectiveMeasure {
  id: string;
  jobCode: string;
  department: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  payGapPercentage: number;
  targetSalaryMin: number;
  targetSalaryMax: number;
  currentSalaryMin: number;
  currentSalaryMax: number;
  description: string;
  deadline: string;
  createdDate: string;
  completionDate?: string;
  responsiblePerson: string;
  notes?: string;
}

export default function CorrectiveMeasuresPage() {
  const router = useRouter();
  const { role } = useAuth();
  const { t } = useLanguage();

  const [measures, setMeasures] = useState<CorrectiveMeasure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    department: '',
    jobCode: '',
  });
  const [selectedMeasure, setSelectedMeasure] = useState<CorrectiveMeasure | null>(null);

  // Check authorization
  useEffect(() => {
    if (role && !['COMPLIANCE_OFFICER', 'ADMIN'].includes(role)) {
      router.push('/dashboard');
    }
  }, [role, router]);

  // Load corrective measures
  useEffect(() => {
    loadMeasures();
  }, []);

  const loadMeasures = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.getCorrectiveMeasures(filters);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch corrective measures');
      }

      // API returns { measures: [...], total, count, limit, offset }
      const measuresData = response.data?.measures || response.data || [];
      setMeasures(Array.isArray(measuresData) ? measuresData : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load corrective measures';
      setError(errorMessage);
      console.error('Corrective measures error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    loadMeasures();
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      department: '',
      jobCode: '',
    });
  };

  const getStatusColor = (status: string) => {
    if (status === 'COMPLETED') return 'badge-success';
    if (status === 'IN_PROGRESS') return 'badge-warning';
    if (status === 'PENDING') return 'badge-info';
    if (status === 'ON_HOLD') return 'badge-danger';
    return 'badge-info';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'În așteptare';
      case 'IN_PROGRESS':
        return 'În progres';
      case 'COMPLETED':
        return 'Finalizată';
      case 'ON_HOLD':
        return 'Suspendată';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ro-RO');
    } catch {
      return dateString;
    }
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">📋 Măsuri Corective</h1>
          <p className="text-sm text-gray-600 mt-2">
            Plan de acțiune pentru reducerea decalajelor salariale
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Filtre</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">Status</label>
              <select
                value={filters.status}
                onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="form-select"
              >
                <option value="">Toate statusurile</option>
                <option value="PENDING">În așteptare</option>
                <option value="IN_PROGRESS">În progres</option>
                <option value="COMPLETED">Finalizată</option>
                <option value="ON_HOLD">Suspendată</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Departament</label>
              <input
                type="text"
                placeholder="ex: Developers, Managers"
                value={filters.department}
                onChange={e => setFilters(prev => ({ ...prev, department: e.target.value }))}
                className="form-input"
              />
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Cod Job</label>
              <input
                type="text"
                placeholder="ex: DEV-JR-001"
                value={filters.jobCode}
                onChange={e => setFilters(prev => ({ ...prev, jobCode: e.target.value }))}
                className="form-input"
              />
            </div>

            <div className="flex gap-2 items-end">
              <button onClick={applyFilters} className="btn btn-primary flex-1" disabled={loading}>
                {loading ? '⏳ Se încarcă...' : '🔍 Aplică Filtre'}
              </button>
              <button onClick={clearFilters} className="btn btn-secondary flex-1">
                🔄 Resetează
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <p className="font-medium">⚠️ Eroare</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Summary Stats */}
      {measures.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-gray-600 uppercase font-semibold">Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{measures.length}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-gray-600 uppercase font-semibold">În Progres</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {measures.filter(m => m.status === 'IN_PROGRESS').length}
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-gray-600 uppercase font-semibold">Finalizate</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {measures.filter(m => m.status === 'COMPLETED').length}
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-gray-600 uppercase font-semibold">Suspendате</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {measures.filter(m => m.status === 'ON_HOLD').length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Measures Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">
            {measures.length} Măsuri Corective
          </h2>
        </div>
        <div className="card-body overflow-x-auto">
          {measures.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nu au fost găsite măsuri corective</p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Job / Department</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Decalaj Salarial</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Termen Limită</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Responsabil</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {measures.map((measure, idx) => {
                  const daysRemaining = getDaysRemaining(measure.deadline);
                  const isUrgent = daysRemaining <= 30 && daysRemaining > 0;
                  const isOverdue = daysRemaining < 0;

                  return (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-semibold">{measure.jobCode}</div>
                        <div className="text-xs text-gray-500">{measure.department}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`badge ${getStatusColor(measure.status)}`}>
                          {getStatusLabel(measure.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-semibold text-red-600">{measure.payGapPercentage}%</div>
                        <div className="text-xs text-gray-600">
                          Target: {measure.targetSalaryMin.toLocaleString()} - {measure.targetSalaryMax.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">{formatDate(measure.deadline)}</div>
                        <div className={`text-xs font-semibold ${isOverdue ? 'text-red-600' : isUrgent ? 'text-yellow-600' : 'text-gray-600'}`}>
                          {isOverdue ? `⚠️ Scadență depășită` : isUrgent ? `⏰ ${daysRemaining} zile` : `${daysRemaining} zile`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {measure.responsiblePerson}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => setSelectedMeasure(measure)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Detalii
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedMeasure && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="measure-detail-title"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 id="measure-detail-title" className="text-2xl font-bold text-gray-900">
                  {selectedMeasure.jobCode}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{selectedMeasure.department}</p>
              </div>
              <button
                onClick={() => setSelectedMeasure(null)}
                className="text-gray-600 hover:text-gray-900 text-2xl"
                aria-label="Close measure details modal"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Timeline */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Status</p>
                  <p className="font-bold text-gray-900 mt-2">{getStatusLabel(selectedMeasure.status)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Creat</p>
                  <p className="font-bold text-gray-900 mt-2">{formatDate(selectedMeasure.createdDate)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Termen Limită</p>
                  <p className="font-bold text-gray-900 mt-2">{formatDate(selectedMeasure.deadline)}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Descriere</h3>
                <p className="text-gray-700">{selectedMeasure.description}</p>
              </div>

              {/* Pay Gap Analysis */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Analiza Decalajului Salarial</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-blue-700 uppercase font-semibold">Salariu Curent</p>
                    <p className="text-lg font-bold text-blue-900 mt-1">
                      {selectedMeasure.currentSalaryMin.toLocaleString()} - {selectedMeasure.currentSalaryMax.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700 uppercase font-semibold">Salariu Țintă</p>
                    <p className="text-lg font-bold text-blue-900 mt-1">
                      {selectedMeasure.targetSalaryMin.toLocaleString()} - {selectedMeasure.targetSalaryMax.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Decalaj Salarial</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{selectedMeasure.payGapPercentage}%</p>
                </div>
              </div>

              {/* Responsible & Notes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 uppercase font-semibold mb-2">Persoană Responsabilă</p>
                  <p className="text-gray-900 font-medium">{selectedMeasure.responsiblePerson}</p>
                </div>
                {selectedMeasure.completionDate && (
                  <div>
                    <p className="text-sm text-gray-600 uppercase font-semibold mb-2">Data Finalizării</p>
                    <p className="text-gray-900 font-medium">{formatDate(selectedMeasure.completionDate)}</p>
                  </div>
                )}
              </div>

              {selectedMeasure.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-900 font-semibold mb-2">Observații</p>
                  <p className="text-yellow-800">{selectedMeasure.notes}</p>
                </div>
              )}

              {/* Compliance Note */}
              <div className="alert alert-info">
                <p className="font-medium">🔒 Conformitate GDPR</p>
                <p className="text-sm mt-1">
                  Măsurile corective sunt monitorizate pentru conformitate cu Directiva 2023/970. Accesul este restricționat doar utilizatorilor autorizați.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
              <button onClick={() => window.print()} className="btn btn-secondary">
                🖨️ Tipărire
              </button>
              <button onClick={() => setSelectedMeasure(null)} className="btn btn-secondary ml-auto">
                Închidere
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
