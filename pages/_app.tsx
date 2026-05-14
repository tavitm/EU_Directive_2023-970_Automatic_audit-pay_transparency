import React, { useEffect, useState } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import '../styles/globals.css';

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

  // Initialize auth from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    const savedRole = localStorage.getItem('role');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setRole(savedRole);
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Mock authentication with demo credentials
      const demoAccounts: {
        [key: string]: { password: string; role: string; name: string };
      } = {
        'employee@example.com': {
          password: 'password',
          role: 'EMPLOYEE',
          name: 'John Employee',
        },
        'manager@example.com': {
          password: 'password',
          role: 'MANAGER',
          name: 'Jane Manager',
        },
        'hr@example.com': {
          password: 'password',
          role: 'HR_SPECIALIST',
          name: 'HR Admin',
        },
        'compliance@example.com': {
          password: 'password',
          role: 'COMPLIANCE_OFFICER',
          name: 'Compliance Officer',
        },
      };

      // Validate credentials
      const account = demoAccounts[email.toLowerCase()];
      if (!account || account.password !== password) {
        throw new Error('Invalid email or password');
      }

      // Mock token and user data
      const newToken = `mock-jwt-token-${Date.now()}-${Math.random()}`;
      const userData = {
        id: `user-${email.split('@')[0]}`,
        email,
        name: account.name,
        role: account.role,
      };

      setToken(newToken);
      setUser(userData);
      setRole(account.role);

      localStorage.setItem('authToken', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', account.role);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authValue}>
      {isPublicRoute ? (
        <Component {...pageProps} />
      ) : (
        <div className="flex h-screen bg-gray-100">
          {/* Sidebar Navigation */}
          <aside className="w-64 bg-white shadow-md overflow-y-auto flex flex-col">
            <nav className="p-6 flex-1">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-blue-600">Directive 2023/970</h1>
                <p className="text-sm text-gray-600 mt-1">Pay Transparency System</p>
              </div>

              <div className="space-y-2">
                {/* Dashboard */}
                <NavLink href="/dashboard" label="Dashboard" icon="📊" />

                {/* Job Management - HR_SPECIALIST+ */}
                {role && ['HR_SPECIALIST', 'COMPLIANCE_OFFICER', 'CFO', 'ADMIN'].includes(role) && (
                  <>
                    <div className="pt-4 pb-2">
                      <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Job Management
                      </p>
                    </div>
                    <NavLink href="/jobs" label="Job Evaluations" icon="💼" />
                    <NavLink href="/jobs/create" label="New Job" icon="➕" />
                  </>
                )}

                {/* Employee Data - HR_SPECIALIST+ */}
                {role && ['HR_SPECIALIST', 'COMPLIANCE_OFFICER', 'CFO', 'ADMIN'].includes(role) && (
                  <>
                    <div className="pt-4 pb-2">
                      <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Employees
                      </p>
                    </div>
                    <NavLink href="/employees/import" label="Import Data" icon="📥" />
                  </>
                )}

                {/* Analysis & Justifications */}
                {role && ['MANAGER', 'HR_SPECIALIST', 'COMPLIANCE_OFFICER', 'CFO', 'ADMIN'].includes(role) && (
                  <>
                    <div className="pt-4 pb-2">
                      <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Analysis
                      </p>
                    </div>
                    <NavLink href="/analysis" label="Pay Gap Analysis" icon="📈" />
                    <NavLink href="/justifications" label="Justifications" icon="📋" />
                  </>
                )}

                {/* Employee Self-Service */}
                {role && ['EMPLOYEE', 'MANAGER', 'HR_SPECIALIST', 'COMPLIANCE_OFFICER', 'CFO', 'ADMIN'].includes(role) && (
                  <>
                    <div className="pt-4 pb-2">
                      <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        My Data
                      </p>
                    </div>
                    <NavLink href="/transparency" label="Transparency Request" icon="🔍" />
                  </>
                )}

                {/* Reports & Compliance - COMPLIANCE_OFFICER+ */}
                {role && ['COMPLIANCE_OFFICER', 'CFO', 'ADMIN'].includes(role) && (
                  <>
                    <div className="pt-4 pb-2">
                      <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Reports
                      </p>
                    </div>
                    <NavLink href="/reports" label="Compliance Reports" icon="📊" />
                    <NavLink href="/audit" label="Audit Logs" icon="📋" />
                  </>
                )}

                {/* Admin - ADMIN only */}
                {role === 'ADMIN' && (
                  <>
                    <div className="pt-4 pb-2">
                      <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Administration
                      </p>
                    </div>
                    <NavLink href="/admin/users" label="Users" icon="👥" />
                    <NavLink href="/admin/settings" label="Settings" icon="⚙️" />
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
                  title="Logout"
                >
                  🚪
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {getPageTitle(router.pathname)}
              </h2>
            </header>
            <div className="p-8">
              <Component {...pageProps} />
            </div>
          </main>
        </div>
      )}
    </AuthContext.Provider>
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

function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/jobs': 'Job Evaluations',
    '/jobs/create': 'Create Job Evaluation',
    '/employees/import': 'Import Employee Data',
    '/analysis': 'Pay Gap Analysis',
    '/justifications': 'Justifications',
    '/transparency': 'Transparency Request',
    '/reports': 'Compliance Reports',
    '/audit': 'Audit Logs',
    '/admin/users': 'User Management',
    '/admin/settings': 'Settings',
  };

  return titles[pathname] || 'Directive 2023/970';
}

export default MyApp;
