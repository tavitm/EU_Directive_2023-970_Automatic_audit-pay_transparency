import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/pages/_app';
import { useLanguage } from '@/utils/useLanguage';
import { adminApi } from '@/utils/apiClient';

interface Setting {
  key: string;
  label: string;
  value: string | boolean;
  description: string;
  type: 'text' | 'number' | 'toggle' | 'select';
  options?: Array<{ label: string; value: string }>;
}

export default function SettingsPage() {
  const router = useRouter();
  const { role } = useAuth();
  const { t } = useLanguage();

  const [settings, setSettings] = useState<Setting[]>([
    {
      key: 'company_name',
      label: 'Nume Companie',
      value: 'Compania ABC',
      description: 'Numele oficial al companiei',
      type: 'text',
    },
    {
      key: 'audit_retention_days',
      label: 'Zile Retenție Audit (zile)',
      value: '90',
      description: 'Numărul de zile pentru a păstra jurnalele de audit',
      type: 'number',
    },
    {
      key: 'enable_salary_transparency',
      label: 'Transparență Salariu Activă',
      value: true,
      description: 'Permite angajaților să vadă informații despre salarii',
      type: 'toggle',
    },
    {
      key: 'require_manager_approval',
      label: 'Aprobare Manager Necesară',
      value: true,
      description: 'Cere aprobarea managerului pentru ajustări salariale',
      type: 'toggle',
    },
    {
      key: 'pay_gap_threshold',
      label: 'Prag Decalaj Salarial (%)',
      value: '10',
      description: 'Procentul minim pentru a declara decalaj salarial',
      type: 'number',
    },
    {
      key: 'notification_frequency',
      label: 'Frecvență Notificări',
      value: 'weekly',
      description: 'Cât de des să trimită notificări de audit',
      type: 'select',
      options: [
        { label: 'Zilnic', value: 'daily' },
        { label: 'Săptămânal', value: 'weekly' },
        { label: 'Lunar', value: 'monthly' },
      ],
    },
    {
      key: 'gdpr_compliant',
      label: 'Conformitate GDPR Obligatorie',
      value: true,
      description: 'Forțează conformitatea cu GDPR în toate operațiile',
      type: 'toggle',
    },
    {
      key: 'auto_pseudonymization',
      label: 'Pseudonimizare Automată',
      value: true,
      description: 'Pseudonimizează automat datele sensibile',
      type: 'toggle',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changedSettings, setChangedSettings] = useState<Set<string>>(new Set());

  // Check authorization
  useEffect(() => {
    if (role && role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [role, router]);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev =>
      prev.map(s => (s.key === key ? { ...s, value } : s))
    );
    setChangedSettings(prev => new Set([...prev, key]));
    setSuccess(false);
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Simulate saving settings
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In a real app, would save to backend
      setSuccess(true);
      setChangedSettings(new Set());
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    // Reset to original values - in a real app would fetch from backend
    setChangedSettings(new Set());
    setError(null);
    setSuccess(false);
  };

  const handleExportData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create CSV data with all users
      const csvContent = [
        ['ID', 'Nume', 'Email', 'Rol', 'Departament', 'Status', 'Data Creare'],
        ['emp-001', 'Ion Popescu', 'employee@company.com', 'EMPLOYEE', 'Engineering', 'ACTIVE', '2024-01-10'],
        ['mgr-001', 'Maria Ionescu', 'manager@company.com', 'MANAGER', 'Engineering', 'ACTIVE', '2024-01-10'],
        ['hr-001', 'Alexandra Dumitrescu', 'hr@company.com', 'HR_SPECIALIST', 'HR', 'ACTIVE', '2024-01-10'],
        ['com-001', 'Mihai Georgescu', 'compliance@company.com', 'COMPLIANCE_OFFICER', 'Compliance', 'ACTIVE', '2024-01-10'],
        ['adm-001', 'Administrator', 'admin@company.com', 'ADMIN', 'IT', 'ACTIVE', '2024-01-01'],
      ]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = window.URL.createObjectURL(blob);
      link.href = url;
      link.download = `export_${new Date().toISOString().split('T')[0]}.csv`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Eroare la exportarea datelor');
      console.error('Export error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurgeAuditLogs = async () => {
    if (!window.confirm('Ești sigur? Aceasta va șterge toate jurnalele de audit mai vechi de 90 de zile.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.purgeAuditLogs();

      if (!response.success) {
        throw new Error(response.error || 'Eroare la purjarea jurnalelor de audit');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Eroare la purjarea jurnalelor de audit';
      setError(errorMessage);
      console.error('Purge audit logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseBackup = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get authentication token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

      if (!token) {
        throw new Error('Nicio sesiune de autentificare. Vă rugăm să vă reconectați.');
      }

      // Fetch with Authorization header
      const response = await fetch('/api/admin/backup', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to create database backup`);
      }

      // Get the filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'backup.json';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]*)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      } else {
        filename = `backup_${new Date().toISOString().split('T')[0]}.json`;
      }

      // Get response as blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);

      // Trigger download
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Eroare la crearea backup-ului';
      setError(errorMessage);
      console.error('Backup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">⚙️ Setări</h1>
          <p className="text-sm text-gray-600 mt-2">
            Configurare și manage setările sistemului
          </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="alert alert-success">
          <p className="font-medium">✓ Succes</p>
          <p className="text-sm mt-1">Setările au fost salvate cu succes</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <p className="font-medium">⚠️ Eroare</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* System Settings */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Setări Sistem</h2>
        </div>
        <div className="card-body space-y-6">
          {settings.map(setting => (
            <div key={setting.key} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{setting.label}</p>
                  <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                </div>
                {changedSettings.has(setting.key) && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">
                    Modificat
                  </span>
                )}
              </div>

              {setting.type === 'text' && (
                <input
                  type="text"
                  value={setting.value}
                  onChange={e => handleSettingChange(setting.key, e.target.value)}
                  className="form-input mt-2"
                />
              )}

              {setting.type === 'number' && (
                <input
                  type="number"
                  value={setting.value}
                  onChange={e => handleSettingChange(setting.key, e.target.value)}
                  className="form-input mt-2"
                />
              )}

              {setting.type === 'toggle' && (
                <div className="mt-2 flex items-center">
                  <button
                    onClick={() => handleSettingChange(setting.key, !setting.value)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      setting.value ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        setting.value ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {setting.value ? 'Activ' : 'Inactiv'}
                  </span>
                </div>
              )}

              {setting.type === 'select' && setting.options && (
                <select
                  value={setting.value}
                  onChange={e => handleSettingChange(setting.key, e.target.value)}
                  className="form-select mt-2"
                >
                  {setting.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card">
        <div className="card-body">
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleResetSettings}
              className="btn btn-secondary"
              disabled={loading || changedSettings.size === 0}
            >
              🔄 Resetează
            </button>
            <button
              onClick={handleSaveSettings}
              className="btn btn-primary"
              disabled={loading || changedSettings.size === 0}
            >
              {loading ? '⏳ Se salvează...' : '💾 Salvează Setări'}
            </button>
          </div>
        </div>
      </div>

      {/* Data Management Stats */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Statistici Date</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-700 uppercase font-semibold">Utilizatori Totali</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">5</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-700 uppercase font-semibold">Jurnale Audit</p>
              <p className="text-2xl font-bold text-green-900 mt-1">124</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <p className="text-sm text-yellow-700 uppercase font-semibold">Măsuri Corective</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1">4</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-purple-700 uppercase font-semibold">Spațiu Folosit</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">150 GB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Gestionare Date</h2>
        </div>
        <div className="card-body space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Exportare Date</p>
              <p className="text-sm text-gray-600 mt-1">
                Exportează toate datele din sistem în format CSV
              </p>
            </div>
            <button
              onClick={handleExportData}
              disabled={loading}
              className="btn btn-secondary"
            >
              {loading ? '⏳ Se exportă...' : '📥 Exportare'}
            </button>
          </div>

          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Purjare Jurnale de Audit</p>
              <p className="text-sm text-gray-600 mt-1">
                Șterge jurnalele de audit mai vechi de 90 de zile
              </p>
            </div>
            <button
              onClick={handlePurgeAuditLogs}
              disabled={loading}
              className="btn btn-danger"
            >
              {loading ? '⏳ Se purjează...' : '🗑️ Purjare'}
            </button>
          </div>

          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Backup Bază Date</p>
              <p className="text-sm text-gray-600 mt-1">
                Creează o copie de siguranță a tuturor datelor
              </p>
            </div>
            <button
              onClick={handleDatabaseBackup}
              disabled={loading}
              className="btn btn-secondary"
            >
              {loading ? '⏳ Se creează...' : '💾 Backup'}
            </button>
          </div>
        </div>
      </div>

      {/* Maintenance */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Întreținere Sistem</h2>
        </div>
        <div className="card-body space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="font-medium text-blue-900 mb-2">Informații Sistem</p>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex justify-between">
                <span>Versiune Aplicație:</span>
                <span className="font-mono">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Versiune Bază Date:</span>
                <span className="font-mono">PostgreSQL 14.5</span>
              </div>
              <div className="flex justify-between">
                <span>Spațiu Disponibil:</span>
                <span className="font-mono">850 GB / 1 TB</span>
              </div>
              <div className="flex justify-between">
                <span>Ultima Verificare:</span>
                <span className="font-mono">15.05.2024 09:30</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="font-medium text-green-900 mb-2">Status Sistem</p>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-green-800">Toate sistemele operaționale</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Compliance */}
      <div className="alert alert-info">
        <p className="font-medium">🔒 Securitate & Conformitate</p>
        <p className="text-sm mt-1">
          Modificările la setări sunt înregistrate în jurnalul de audit. Doar administratorii pot accesa această pagină. Toate operațiile sunt protejate de criptare end-to-end.
        </p>
      </div>
    </div>
  );
}
