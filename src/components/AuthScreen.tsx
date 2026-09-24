import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckSquare,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Database,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { signIn, signUp, requestPasswordReset } from '../lib/auth';
import { UserProfile } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: UserProfile) => void;
  isSupabaseConnected: boolean;
  onOpenSupabaseModal: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function AuthScreen({
  onAuthSuccess,
  isSupabaseConnected,
  onOpenSupabaseModal,
  theme,
  onToggleTheme,
}: AuthScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await signIn(email, password);
        if (res.error) {
          setError(res.error);
        } else if (res.user) {
          onAuthSuccess(res.user);
        }
      } else if (mode === 'signup') {
        const res = await signUp(email, password, name);
        if (res.error) {
          setError(res.error);
        } else if (res.user) {
          if (res.message) {
            setMessage(res.message);
          }
          onAuthSuccess(res.user);
        }
      } else if (mode === 'forgot') {
        const res = await requestPasswordReset(email);
        if (!res.success) {
          setError(res.error || 'Failed to send password reset');
        } else {
          setMessage(res.message || 'Password reset link sent to your email.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0c0d0e] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Bar */}
      <header className="h-14 border-b border-neutral-200/80 dark:border-white/[0.08] px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-xs">
            <CheckSquare className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-white">
            Minimalist Tasks
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="w-8 h-8 rounded-md border border-neutral-200 dark:border-white/[0.08] bg-transparent hover:bg-neutral-100 dark:hover:bg-white/[0.05] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Database Status Button */}
          <button
            type="button"
            onClick={onOpenSupabaseModal}
            className={`h-8 flex items-center gap-1.5 px-2.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
              isSupabaseConnected
                ? 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10'
                : 'border-neutral-200 dark:border-white/[0.08] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.05]'
            }`}
            title="Database Configuration"
          >
            <Database className="w-3.5 h-3.5 opacity-80" />
            <span className="hidden sm:inline text-[11px]">
              {isSupabaseConnected ? 'Connected' : 'Database'}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSupabaseConnected ? 'bg-emerald-500' : 'bg-neutral-400 dark:bg-neutral-600'
              }`}
            />
          </button>
        </div>
      </header>

      {/* Main Centered Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-sm"
        >
          {/* Brand Header */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {mode === 'signin'
                ? 'Sign In to Your Workspace'
                : mode === 'signup'
                ? 'Create Your Account'
                : 'Reset Password'}
            </h1>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {mode === 'signin'
                ? 'Enter your credentials to access your private tasks'
                : mode === 'signup'
                ? 'Get started with a clean, distraction-free workspace'
                : 'Enter your email to receive recovery instructions'}
            </p>
          </div>

          {/* Card Container */}
          <div className="bg-white dark:bg-[#14161b] border border-neutral-200 dark:border-white/[0.1] rounded-xl shadow-lg dark:shadow-2xl/40 overflow-hidden">
            {/* Tabs for Sign In / Create Account */}
            {mode !== 'forgot' && (
              <div className="flex border-b border-neutral-100 dark:border-white/[0.06] bg-neutral-50/80 dark:bg-white/[0.02] p-1.5">
                <button
                  type="button"
                  id="auth-screen-tab-signin"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                    setMessage(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-white dark:bg-[#1f222a] text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  id="auth-screen-tab-signup"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                    setMessage(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-white dark:bg-[#1f222a] text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {mode === 'forgot' && (
              <div className="px-5 pt-4 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                    setMessage(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
              {/* Name field for signup */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
                    <input
                      id="auth-screen-name"
                      type="text"
                      required
                      placeholder="Alex Morgan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
                  <input
                    id="auth-screen-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                  />
                </div>
              </div>

              {/* Password field */}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setError(null);
                          setMessage(null);
                        }}
                        className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
                    <input
                      id="auth-screen-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-9 py-2 text-xs bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 cursor-pointer transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {mode === 'signup' && (
                    <p className="mt-1 text-[11px] text-neutral-400">
                      Must be at least 6 characters
                    </p>
                  )}
                </div>
              )}

              {/* Alerts */}
              {error && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight">{error}</span>
                </div>
              )}

              {message && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight">{message}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                id="auth-screen-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === 'signin'
                        ? 'Sign In'
                        : mode === 'signup'
                        ? 'Create Account'
                        : 'Send Reset Link'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Switch Prompt */}
          <div className="mt-6 text-center text-xs text-neutral-500">
            {mode === 'signin' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                    setMessage(null);
                  }}
                  className="font-semibold text-neutral-900 dark:text-white hover:underline cursor-pointer ml-1"
                >
                  Create an account
                </button>
              </p>
            ) : mode === 'signup' ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                    setMessage(null);
                  }}
                  className="font-semibold text-neutral-900 dark:text-white hover:underline cursor-pointer ml-1"
                >
                  Sign in
                </button>
              </p>
            ) : null}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
