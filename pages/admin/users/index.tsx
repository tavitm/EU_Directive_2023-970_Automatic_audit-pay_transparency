import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/pages/_app';
import { useLanguage } from '@/utils/useLanguage';
import { adminApi } from '@/utils/apiClient';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'HR_SPECIALIST' | 'COMPLIANCE_OFFICER' | 'CFO' | 'ADMIN';
  department: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  lastLogin?: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { role } = useAuth();
  const { t } = useLanguage();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE',
    department: '',
  });

  // Check authorization
  useEffect(() => {
    if (role && role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [role, router]);

  // Load users
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.listUsers(
        filters.role || undefined,
        filters.status || undefined
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch users');
      }

      const usersData = response.data?.users || response.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMessage);
      console.error('Users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    loadUsers();
  };

  const clearFilters = () => {
    setFilters({
      role: '',
      status: '',
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUser.name || !newUser.email || !newUser.role) {
      setError('⚠️ Vă rugăm completați toate câmpurile obligatorii');
      return;
    }

    try {
      const response = await adminApi.createUser({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to create user');
      }

      setNewUser({
        name: '',
        email: '',
        role: 'EMPLOYEE',
        department: '',
      });
      setShowNewUserForm(false);
      loadUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
    }
  };

  const getRoleColor = (role: string) => {
    if (role === 'ADMIN') return 'badge-danger';
    if (role === 'COMPLIANCE_OFFICER') return 'badge-warning';
    if (role === 'HR_SPECIALIST') return 'badge-primary';
    if (role === 'CFO') return 'badge-warning';
    if (role === 'MANAGER') return 'badge-info';
    return 'badge-secondary';
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      ADMIN: 'Administrator',
      EMPLOYEE: 'Angajat',
      MANAGER: 'Manager',
      HR_SPECIALIST: 'Specialist HR',
      COMPLIANCE_OFFICER: 'Officer Conformitate',
      CFO: 'CFO',
    };
    return roleMap[role] || role;
  };

  const getStatusColor = (status: string) => {
    if (status === 'ACTIVE') return 'badge-success';
    if (status === 'INACTIVE') return 'badge-secondary';
    if (status === 'SUSPENDED') return 'badge-danger';
    return 'badge-secondary';
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      ACTIVE: 'Activ',
      INACTIVE: 'Inactiv',
      SUSPENDED: 'Suspendat',
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ro-RO');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">👥 Utilizatori</h1>
            <p className="text-sm text-gray-600 mt-2">
              Gestionare utilizatori și permisiuni de acces
            </p>
          </div>
          <button
            onClick={() => setShowNewUserForm(!showNewUserForm)}
            className="btn btn-primary"
          >
            {showNewUserForm ? '✕ Anulare' : '➕ Utilizator Nou'}
          </button>
        </div>
      </div>

      {/* New User Form */}
      {showNewUserForm && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Adăugare Utilizator Nou</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Nume Complet *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="ex: Ion Popescu"
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="ex: ion.popescu@company.com"
                    className="form-input"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Rol *</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                    className="form-select"
                    required
                  >
                    <option value="EMPLOYEE">Angajat</option>
                    <option value="MANAGER">Manager</option>
                    <option value="HR_SPECIALIST">Specialist HR</option>
                    <option value="COMPLIANCE_OFFICER">Officer Conformitate</option>
                    <option value="CFO">CFO</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Departament</label>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={e => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="ex: Engineering, HR"
                    className="form-input"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">
                  ✓ Creare Utilizator
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewUserForm(false)}
                  className="btn btn-secondary"
                >
                  Anulare
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Filtre</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">Rol</label>
              <select
                value={filters.role}
                onChange={e => setFilters(prev => ({ ...prev, role: e.target.value }))}
                className="form-select"
              >
                <option value="">Toate rolurile</option>
                <option value="ADMIN">Administrator</option>
                <option value="COMPLIANCE_OFFICER">Officer Conformitate</option>
                <option value="HR_SPECIALIST">Specialist HR</option>
                <option value="CFO">CFO</option>
                <option value="MANAGER">Manager</option>
                <option value="EMPLOYEE">Angajat</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Status</label>
              <select
                value={filters.status}
                onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="form-select"
              >
                <option value="">Toate statusurile</option>
                <option value="ACTIVE">Activ</option>
                <option value="INACTIVE">Inactiv</option>
                <option value="SUSPENDED">Suspendat</option>
              </select>
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

      {/* Users List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">
            {users.length} Utilizatori
          </h2>
        </div>
        <div className="card-body overflow-x-auto">
          {users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nu au fost găsiți utilizatori</p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Nume</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Rol</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Departament</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Ultimul Login</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`badge ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {user.department}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`badge ${getStatusColor(user.status)}`}>
                        {getStatusLabel(user.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-xs">
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Nu s-a conectat'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Detalii
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-detail-title"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 id="user-detail-title" className="text-2xl font-bold text-gray-900">
                  {selectedUser.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-600 hover:text-gray-900 text-2xl"
                aria-label="Close user details modal"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Rol</p>
                  <p className="font-bold text-gray-900 mt-2">{getRoleLabel(selectedUser.role)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Status</p>
                  <p className="font-bold text-gray-900 mt-2">{getStatusLabel(selectedUser.status)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Departament</p>
                  <p className="font-bold text-gray-900 mt-2">{selectedUser.department}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Creat</p>
                  <p className="font-bold text-gray-900 mt-2">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Informații Cont</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900">{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">ID Utilizator:</span>
                    <span className="font-mono text-xs text-gray-900">{selectedUser.id}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Ultimul Login:</span>
                    <span className="font-medium text-gray-900">
                      {selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Nu s-a conectat'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security Note */}
              <div className="alert alert-info">
                <p className="font-medium">🔒 Securitate</p>
                <p className="text-sm mt-1">
                  Accesul utilizatorilor este monitorizat și logged. Orice modificare va fi înregistrată în jurnalul de audit.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
              <button onClick={() => window.print()} className="btn btn-secondary">
                🖨️ Tipărire
              </button>
              <button onClick={() => setSelectedUser(null)} className="btn btn-secondary ml-auto">
                Închidere
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
