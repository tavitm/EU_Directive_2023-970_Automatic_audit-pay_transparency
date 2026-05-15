import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/pages/_app';
import { useLanguage } from '@/utils/useLanguage';
import { adminApi } from '@/utils/apiClient';

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  statusCode: number;
  details?: any;
  ipAddress: string;
  timestamp: string;
}

export default function AuditPage() {
  const router = useRouter();
  const { role } = useAuth();
  const { t } = useLanguage();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    action: '',
    resource: '',
    userId: '',
    startDate: '',
    endDate: '',
  });

  // Check authorization
  useEffect(() => {
    if (role && !['COMPLIANCE_OFFICER', 'ADMIN'].includes(role)) {
      router.push('/dashboard');
    }
  }, [role, router]);

  // Load audit logs
  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.getAuditLogs(filters);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch audit logs');
      }

      // API returns { logs: [...], total, count, limit, offset }
      const logsData = response.data?.logs || response.data || [];
      setLogs(Array.isArray(logsData) ? logsData : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audit logs';
      setError(errorMessage);
      console.error('Audit logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    loadAuditLogs();
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      resource: '',
      userId: '',
      startDate: '',
      endDate: '',
    });
  };

  const getActionColor = (action: string) => {
    if (action.includes('DELETE')) return 'badge-danger';
    if (action.includes('CREATE')) return 'badge-success';
    if (action.includes('UPDATE')) return 'badge-warning';
    return 'badge-info';
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('ro-RO');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">📋 {t('nav.auditLogs') || 'Audit Logs'}</h1>
          <p className="text-sm text-gray-600 mt-2">
            Istoricul tuturor acțiunilor efectuate în sistem
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Filtre</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">Acțiune</label>
              <input
                type="text"
                placeholder="ex: CREATE, UPDATE, DELETE"
                value={filters.action}
                onChange={e => setFilters(prev => ({ ...prev, action: e.target.value }))}
                className="form-input"
              />
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Resursă</label>
              <input
                type="text"
                placeholder="ex: USERS, JOBS, EMPLOYEES"
                value={filters.resource}
                onChange={e => setFilters(prev => ({ ...prev, resource: e.target.value }))}
                className="form-input"
              />
            </div>

            <div className="form-group mb-0">
              <label className="form-label">User ID</label>
              <input
                type="text"
                placeholder="ID utilizator"
                value={filters.userId}
                onChange={e => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                className="form-input"
              />
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Data de la</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="form-input"
              />
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Data până la</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
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

      {/* Audit Logs Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">
            {logs.length} Înregistrări de Audit
          </h2>
        </div>
        <div className="card-body overflow-x-auto">
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nu au fost găsite înregistrări de audit</p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Data/Ora</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Utilizator</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Acțiune</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Resursă</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>{log.userEmail || log.userId}</div>
                      <div className="text-xs text-gray-500">{log.userId}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`badge ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>{log.resource}</div>
                      <div className="text-xs text-gray-500">{log.resourceId}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`badge ${log.statusCode >= 200 && log.statusCode < 300 ? 'badge-success' : 'badge-danger'}`}>
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-xs font-mono">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Compliance Note */}
      <div className="alert alert-info">
        <p className="font-medium">🔒 GDPR Compliant</p>
        <p className="text-sm mt-1">
          Audit logs sunt păstrate pentru conformitate cu regulamentele de retenție a datelor. Acces restricționat doar la utilizatori autorizați.
        </p>
      </div>
    </div>
  );
}
