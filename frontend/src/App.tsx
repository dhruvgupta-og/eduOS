import React, { useState, useEffect } from 'react';
import { EduOSProvider, useEduOS } from './context/EduOSContext';
import { Login } from './pages/auth/Login';
import { SuperAdminDashboard } from './pages/super-admin/SuperAdminDashboard';
import { PrincipalDashboard } from './pages/principal/PrincipalDashboard';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { StudentParentDashboard } from './pages/student-parent/StudentParentDashboard';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const AppRouter: React.FC = () => {
  const { session, authLoading, currentRole } = useEduOS();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const getDashboardPathForRole = (role: string | null) => {
    switch (role) {
      case 'super_admin':
        return '/vendor';
      case 'principal':
      case 'admin':
        return '/app/dashboard';
      case 'teacher':
        return '/app/classes';
      case 'student':
      case 'parent':
        return '/app/portal';
      default:
        return '/app/dashboard';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-stone-100 font-sans">
        <div className="p-8 bg-white border border-stone-200 rounded-2xl shadow-sm text-center max-w-sm">
          <div className="w-8 h-8 border-3 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-bold uppercase tracking-wider text-xs text-stone-600">Loading EduOS...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return (
      <Login
        onSuccess={(role) => {
          const dest = getDashboardPathForRole(role);
          navigate(dest);
        }}
      />
    );
  }

  // Guard /vendor so only super_admin can reach it
  if (currentPath.startsWith('/vendor')) {
    if (currentRole !== 'super_admin') {
      const fallback = getDashboardPathForRole(currentRole);
      return (
        <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 max-w-md text-center shadow-sm">
            <h2 className="text-lg font-bold text-stone-900">Access Denied</h2>
            <p className="text-sm text-stone-500 mt-2 mb-4">
              Vendor console is restricted to Super Admin administrators.
            </p>
            <button
              onClick={() => navigate(fallback)}
              className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold"
            >
              Go to my Dashboard
            </button>
          </div>
        </div>
      );
    }
    return <SuperAdminDashboard />;
  }

  // Specific role dashboard routes
  if (currentPath === '/app/dashboard') {
    return <PrincipalDashboard />;
  }

  if (currentPath === '/app/classes') {
    return <TeacherDashboard />;
  }

  if (currentPath === '/app/portal') {
    return <StudentParentDashboard />;
  }

  // Fallback routing based on authenticated user's role
  switch (currentRole) {
    case 'super_admin':
      return <SuperAdminDashboard />;
    case 'principal':
    case 'admin':
      return <PrincipalDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
    case 'parent':
      return <StudentParentDashboard />;
    default:
      return <PrincipalDashboard />;
  }
};

export default function App() {
  return (
    <ErrorBoundary>
      <EduOSProvider>
        <AppRouter />
      </EduOSProvider>
    </ErrorBoundary>
  );
}
