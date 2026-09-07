import React, { useState } from 'react';
import { useEduOS } from '../../context/EduOSContext';
import { Shield, Mail, Lock, AlertCircle, ArrowRight, School } from 'lucide-react';

interface LoginProps {
  onSuccess?: (role: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const { loginWithCredentials } = useEduOS();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await loginWithCredentials(email, password);
      if (result.success && result.role) {
        if (onSuccess) {
          onSuccess(result.role);
        }
      } else {
        setError(result.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-stone-900 flex items-center justify-center text-white shadow-md">
            <School className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">EduOS</h2>
            <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-stone-500">School Operating System</p>
          </div>
        </div>
        <h3 className="mt-5 text-xl sm:text-2xl font-bold text-stone-900">Sign in to your account</h3>
        <p className="mt-1 text-xs sm:text-sm text-stone-600">Enter your institution email and password</p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-4 sm:py-8 sm:px-10 shadow-sm border border-stone-200 rounded-2xl">
          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.edu"
                  className="block w-full pl-10 pr-3 py-3 sm:py-2.5 border border-stone-300 rounded-xl shadow-sm text-base sm:text-sm focus:ring-2 focus:ring-stone-900 focus:border-stone-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-3 sm:py-2.5 border border-stone-300 rounded-xl shadow-sm text-base sm:text-sm focus:ring-2 focus:ring-stone-900 focus:border-stone-900 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900 transition disabled:opacity-50 min-h-[44px]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-stone-200 pt-4">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2.5 text-center">
              Quick Fill Demo Accounts
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEmail('dhruvedition@gmail.com');
                  setPassword('Password123!');
                  setError(null);
                }}
                className="p-2.5 border border-stone-200 hover:border-stone-400 bg-stone-50 hover:bg-stone-100 rounded-xl text-left transition active:scale-[0.98] min-h-[44px]"
              >
                <div className="font-semibold text-stone-900">Vendor Super Admin</div>
                <div className="text-[11px] text-stone-500 truncate">dhruvedition@gmail.com</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('principal@greenwood.edu');
                  setPassword('Password123!');
                  setError(null);
                }}
                className="p-2.5 border border-stone-200 hover:border-stone-400 bg-stone-50 hover:bg-stone-100 rounded-xl text-left transition active:scale-[0.98] min-h-[44px]"
              >
                <div className="font-semibold text-stone-900">Principal (School Admin)</div>
                <div className="text-[11px] text-stone-500 truncate">principal@greenwood.edu</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('teacher@greenwood.edu');
                  setPassword('Password123!');
                  setError(null);
                }}
                className="p-2.5 border border-stone-200 hover:border-stone-400 bg-stone-50 hover:bg-stone-100 rounded-xl text-left transition active:scale-[0.98] min-h-[44px]"
              >
                <div className="font-semibold text-stone-900">Teacher / Faculty</div>
                <div className="text-[11px] text-stone-500 truncate">teacher@greenwood.edu</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('student@greenwood.edu');
                  setPassword('Password123!');
                  setError(null);
                }}
                className="p-2.5 border border-stone-200 hover:border-stone-400 bg-stone-50 hover:bg-stone-100 rounded-xl text-left transition active:scale-[0.98] min-h-[44px]"
              >
                <div className="font-semibold text-stone-900">Student Portal</div>
                <div className="text-[11px] text-stone-500 truncate">student@greenwood.edu</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('parent@greenwood.edu');
                  setPassword('Password123!');
                  setError(null);
                }}
                className="p-2.5 sm:col-span-2 border border-stone-200 hover:border-stone-400 bg-stone-50 hover:bg-stone-100 rounded-xl text-left transition active:scale-[0.98] min-h-[44px]"
              >
                <div className="font-semibold text-stone-900">Parent / Guardian Portal</div>
                <div className="text-[11px] text-stone-500 truncate">parent@greenwood.edu</div>
              </button>
            </div>
            <p className="mt-3 text-[11px] text-center text-stone-500 font-mono">
              Universal Password: <span className="font-semibold text-stone-800">Password123!</span>
            </p>
          </div>

          <div className="mt-4 border-t border-stone-100 pt-3 flex items-center justify-center gap-2 text-[11px] sm:text-xs text-stone-500">
            <Shield className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>Secured with PostgreSQL Row Level Security (RLS)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
