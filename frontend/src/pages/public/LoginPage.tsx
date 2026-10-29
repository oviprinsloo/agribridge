import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sprout, Users, Shield, ArrowRight, Loader2, AlertCircle, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    if (!loginEmail || !loginPass) {
      setErrorMsg('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const user = await login({ email: loginEmail, password: loginPass });
      if (user.role === 'FARMER') {
        navigate('/farmer/dashboard');
      } else if (user.role === 'BUYER') {
        navigate('/buyer/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillAndLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    handleLogin(undefined as any, demoEmail, demoPass);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/30">
            <Sprout className="w-7 h-7" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">
            Sign In to AgriBridge
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Access your farmer pool, buyer requirements, or administration console.
          </p>
        </div>

        {/* 1-Click Demo Accounts Box */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-800/60 border border-emerald-200 dark:border-slate-700 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            1-Click Pre-Seeded Demo Access
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Click any account below to instantly authenticate and evaluate the system:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => fillAndLogin('farmer@agribridge.demo', 'Farmer@123')}
              className="p-2.5 bg-white dark:bg-slate-700 hover:bg-emerald-100 text-slate-800 dark:text-slate-100 border border-emerald-300 dark:border-slate-600 rounded-xl text-left transition text-xs flex flex-col justify-between"
            >
              <div className="font-bold flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <Sprout className="w-3.5 h-3.5" /> Farmer
              </div>
              <span className="text-[10px] text-slate-500 truncate mt-1">farmer@...</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => fillAndLogin('buyer@agribridge.demo', 'Buyer@123')}
              className="p-2.5 bg-white dark:bg-slate-700 hover:bg-sky-100 text-slate-800 dark:text-slate-100 border border-sky-300 dark:border-slate-600 rounded-xl text-left transition text-xs flex flex-col justify-between"
            >
              <div className="font-bold flex items-center gap-1 text-sky-700 dark:text-sky-400">
                <Users className="w-3.5 h-3.5" /> Buyer
              </div>
              <span className="text-[10px] text-slate-500 truncate mt-1">buyer@...</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => fillAndLogin('admin@agribridge.demo', 'Admin@123')}
              className="p-2.5 bg-white dark:bg-slate-700 hover:bg-purple-100 text-slate-800 dark:text-slate-100 border border-purple-300 dark:border-slate-600 rounded-xl text-left transition text-xs flex flex-col justify-between"
            >
              <div className="font-bold flex items-center gap-1 text-purple-700 dark:text-purple-400">
                <Shield className="w-3.5 h-3.5" /> Admin
              </div>
              <span className="text-[10px] text-slate-500 truncate mt-1">admin@...</span>
            </button>
          </div>
        </div>

        {/* Regular Login Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-600 font-bold hover:underline">
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
