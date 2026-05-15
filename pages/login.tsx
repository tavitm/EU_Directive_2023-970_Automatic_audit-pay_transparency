import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/pages/_app';
import { useLanguage } from '@/utils/useLanguage';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || t('login.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{t('header.directiveTitle')}</h1>
          <p className="text-blue-100">{t('header.payTransparencySystem')}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('login.title')}</h2>

          {error && (
            <div className="alert alert-error mb-4">
              <p className="font-medium">{t('common.error')}</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                {t('login.email')}
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                {t('login.password')}
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary w-full mt-6"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner mr-2"></span>
                  {t('login.login')}...
                </>
              ) : (
                t('login.login')
              )}
            </button>
          </form>

          {/* Demo Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">
              <strong>📋 {t('login.demoAccounts')}</strong>
            </p>
            <div className="bg-gray-50 rounded p-4 text-xs text-gray-700 space-y-3">
              {/* HR Specialist */}
              <div className="border-b border-gray-200 pb-2 last:border-b-0">
                <p className="font-semibold text-gray-900 mb-1">👤 {t('login.hr')}</p>
                <div className="ml-2 space-y-1 font-mono text-gray-600">
                  <p>📧 <span className="select-all">hr@company.com</span></p>
                  <p>🔑 <span className="select-all">password123</span></p>
                </div>
              </div>

              {/* Compliance Officer */}
              <div className="border-b border-gray-200 pb-2 last:border-b-0">
                <p className="font-semibold text-gray-900 mb-1">⚖️ {t('login.compliance')}</p>
                <div className="ml-2 space-y-1 font-mono text-gray-600">
                  <p>📧 <span className="select-all">compliance@company.com</span></p>
                  <p>🔑 <span className="select-all">password123</span></p>
                </div>
              </div>

              {/* Manager */}
              <div className="border-b border-gray-200 pb-2 last:border-b-0">
                <p className="font-semibold text-gray-900 mb-1">👔 {t('login.manager')}</p>
                <div className="ml-2 space-y-1 font-mono text-gray-600">
                  <p>📧 <span className="select-all">manager@company.com</span></p>
                  <p>🔑 <span className="select-all">password123</span></p>
                </div>
              </div>

              {/* Employee */}
              <div className="border-b border-gray-200 pb-2 last:border-b-0">
                <p className="font-semibold text-gray-900 mb-1">👨‍💼 {t('login.employee')}</p>
                <div className="ml-2 space-y-1 font-mono text-gray-600">
                  <p>📧 <span className="select-all">employee@company.com</span></p>
                  <p>🔑 <span className="select-all">password123</span></p>
                </div>
              </div>

              {/* Admin */}
              <div>
                <p className="font-semibold text-gray-900 mb-1">🔐 Admin</p>
                <div className="ml-2 space-y-1 font-mono text-gray-600">
                  <p>📧 <span className="select-all">admin@company.com</span></p>
                  <p>🔑 <span className="select-all">password123</span></p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">💡 Click on credentials to select</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-blue-100 text-sm">
          <p>Directive 2023/970</p>
          <p>{t('dashboard.gdprCompliant')}</p>
        </div>
      </div>
    </div>
  );
}
