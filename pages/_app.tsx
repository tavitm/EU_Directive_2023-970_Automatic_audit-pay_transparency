import React, { useEffect, useState } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import { LanguageContext } from '@/utils/useLanguage';
import type { Language } from '@/utils/translations';
import { translations, t } from '@/utils/translations';

interface AuthContextType {
  token: string | null;
  user: any | null;
  role: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguageState] = useState<Language>('ro');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize auth and language from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    const savedRole = localStorage.getItem('role');
    const savedLanguage = localStorage.getItem('language') as Language | null;

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setRole(savedRole);
    }

    if (savedLanguage && ['ro', 'en'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }

    setIsLoading(false);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const login = async (email: string, password: string) => {
    try {
      // Call the API login endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error('Invalid response from server');
      }

      const { token, user: userData } = data.data;

      setToken(token);
      setUser(userData);
      setRole(userData.role);

      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', userData.role);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setRole(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    router.push('/login');
  };

  // Protect routes - redirect to login if not authenticated
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(router.pathname);

  if (!isLoading && !token && !isPublicRoute) {
    router.push('/login');
    return null;
  }

  const authValue: AuthContextType = {
    token,
    user,
    role,
    isAuthenticated: !!token,
    login,
    logout,
  };

  // Close mobile menu when route changes
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t(language, 'common.loading')}</p>
        </div>
      </div>
    );
  }

  const languageValue = {
    language,
    setLanguage,
    t: (key: string) => t(language, key),
  };

  return (
    <LanguageContext.Provider value={languageValue}>
      <AuthContext.Provider value={authValue}>
        {isPublicRoute ? (
          <Component {...pageProps} />
        ) : (
        <div className="flex h-screen bg-gray-100">
          {/* Mobile Sidebar Overlay */}
          {mobileMenuOpen && (
            <div
              className="sidebar-overlay mobile-open md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
          )}

          {/* Sidebar Navigation */}
          <aside className={`w-64 bg-white shadow-md overflow-y-auto flex flex-col transition-transform md:relative md:translate-x-0 ${
            mobileMenuOpen ? 'sidebar mobile-open' : 'sidebar'
          }`}>
            <nav className="p-6 flex-1">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-blue-600">{t(language, 'header.directiveTitle')}</h1>
                <p className="text-sm text-gray-600 mt-1">{t(language, 'header.payTransparencySystem')}</p>
              </div>

              <div className="space-y-2">
                {/* Dashboard */}
                <NavLink href="/dashboard" label={t(language, 'nav.dashboard')} icon="📊" />

                {/* Job Management - HR_SPECIALIST+ */}
                {role && ['HR_SPECIALIST', 'COMPLIANCE_OFFICER', 'CFO', 'ADMIN'].includes(role) && (
                  <>
                    <div className="pt-4 pb-2">
                      <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t(language, 'nav.jobManagement')}
                      </p>
                    </div>
                    <NavLink href="/jobs" label={t(language, 'nav.jobEvaluations')} icon="💼" />
                    <NavLink href="/jobs/create" label={t(language, 'nav.newJob')} icon="➕" />
                  </>
                )}

                {/* Employee Data - HR_SPECIALIST+ */}
                {role && ['HR_SPECIALIST', 'COMPLIANCE_OFFICER', 'CFO', 'ADMIN'].includes(role) && (
                  <>
                    <div className="pt-4 pb-2">
                      <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t(language, 'nav.employees')}
                      </p>
                    </div>
                    <NavLink href="/employees/import" label={t(language, 'nav.importData')} icon="📥" />
                  </>
                )}

                {/* Analysis & Justifications */}
                {role && ['MANAGER', 'HR_SPECIALIST', 'COMPLIANCE_OFFICER', 'CFO', 'ADMIN'].includes(role) && (
                  <>
                    <div className="pt-4 pb-2">
                      <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t(language, 'nav.analysis')}
                      </p>
                    </div>
                    <NavLink href="/analysis" label={t(language, 'nav.payGapAnalysis')} icon="📈" />
                    <NavLink href="/justifications" label={t(language, 'nav.justifications')} icon="📋" />
                  </>
                )}

                {/* Employee Self-Service */}
                {role && ['EMPLOYEE', 'MANAGER', 'HR_SPECIALIST', 'COMPLIANCE_OFFICER', 'CFO', 'ADMIN'].includes(role) && (
                  <>
                    <div className="pt-4 pb-2">
                      <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t(language, 'nav.myData')}
                      </p>
                    </div>
                    <NavLink href="/transparency" label={t(language, 'nav.transparencyRequest')} icon="🔍" />
                  </>
                )}

                {/* Reports & Compliance - COMPLIANCE_OFFICER+ */}
                {role && ['COMPLIANCE_OFFICER', 'CFO', 'ADMIN'].includes(role) && (
                  <>
                    <div className="pt-4 pb-2">
                      <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t(language, 'nav.reports')}
                      </p>
                    </div>
                    <NavLink href="/reports" label={t(language, 'nav.complianceReports')} icon="📊" />
                    <NavLink href="/audit" label={t(language, 'nav.auditLogs')} icon="📋" />
                  </>
                )}

                {/* Admin - ADMIN only */}
                {role === 'ADMIN' && (
                  <>
                    <div className="pt-4 pb-2">
                      <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t(language, 'nav.administration')}
                      </p>
                    </div>
                    <NavLink href="/admin/users" label={t(language, 'nav.users')} icon="👥" />
                    <NavLink href="/admin/settings" label={t(language, 'nav.settings')} icon="⚙️" />
                  </>
                )}
              </div>
            </nav>

            {/* User Info & Logout - Fixed at bottom */}
            <div className="border-t border-gray-200 bg-gray-50 p-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user?.email}</p>
                  <p className="text-gray-500 text-xs">{role}</p>
                </div>
                <button
                  onClick={logout}
                  className="text-gray-500 hover:text-gray-700 text-lg"
                  title={t(language, 'common.logout')}
                >
                  🚪
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <header className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-8 py-4 md:py-6 flex justify-between items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
                title="Toggle Menu"
                aria-label="Toggle Navigation Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex-1 md:flex-none truncate">
                {getPageTitle(router.pathname, language)}
              </h2>

              {/* Language Switcher - Mobile Optimized */}
              <div className="flex gap-1 md:gap-2 flex-shrink-0">
                <button
                  onClick={() => setLanguage('ro')}
                  className={`px-2 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base min-h-10 ${
                    language === 'ro'
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                  }`}
                  title="Română"
                >
                  🇷🇴 <span className="hidden sm:inline">RO</span>
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base min-h-10 ${
                    language === 'en'
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                  }`}
                  title="English"
                >
                  🇬🇧 <span className="hidden sm:inline">EN</span>
                </button>
              </div>
            </header>
            <div className="p-4 md:p-8">
              <Component {...pageProps} />
            </div>
          </main>
        </div>
        )}
      </AuthContext.Provider>
    </LanguageContext.Provider>
  );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const router = useRouter();
  const isActive = router.pathname === href;

  return (
    <a
      href={href}
      className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </a>
  );
}

function getPageTitle(pathname: string, language: Language): string {
  const titles: Record<string, Record<Language, string>> = {
    '/dashboard': {
      ro: 'Tablou de Bord',
      en: 'Dashboard',
    },
    '/jobs': {
      ro: 'Evaluări Locuri de Muncă',
      en: 'Job Evaluations',
    },
    '/jobs/create': {
      ro: 'Creare Evaluare Loc de Muncă',
      en: 'Create Job Evaluation',
    },
    '/employees/import': {
      ro: 'Import Date Angajați',
      en: 'Import Employee Data',
    },
    '/analysis': {
      ro: 'Analiza Decalajului Salarial',
      en: 'Pay Gap Analysis',
    },
    '/justifications': {
      ro: 'Justificări',
      en: 'Justifications',
    },
    '/transparency': {
      ro: 'Cerere de Transparență',
      en: 'Transparency Request',
    },
    '/reports': {
      ro: 'Rapoarte de Conformitate',
      en: 'Compliance Reports',
    },
    '/audit': {
      ro: 'Jurnale de Audit',
      en: 'Audit Logs',
    },
    '/admin/users': {
      ro: 'Gestionare Utilizatori',
      en: 'User Management',
    },
    '/admin/settings': {
      ro: 'Setări',
      en: 'Settings',
    },
  };

  return titles[pathname]?.[language] || 'Directive 2023/970';
}

export default MyApp;
