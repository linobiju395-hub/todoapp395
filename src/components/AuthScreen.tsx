import { useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckSquare,
  Mail,
  Sun,
  Moon,
  Database,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { sendOtp, verifyOtp } from '../lib/auth';
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
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await sendOtp(email.trim());

      if (res.error) {
        setError(res.error);
      } else {
        setStep('otp');
        setMessage('A 6-digit verification code has been sent to your email.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setMessage(null);

    if (!/^\d{6}$/.test(code)) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      const res = await verifyOtp(email.trim(), code);

      if (res.error) {
        setError(res.error);
      } else if (res.user) {
        onAuthSuccess(res.user);
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await sendOtp(email.trim());

      if (res.error) {
        setError(res.error);
      } else {
        setMessage('A new verification code has been sent to your email.');
        setCode('');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setStep('email');
    setCode('');
    setError(null);
    setMessage(null);
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
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Database Status */}
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
                isSupabaseConnected
                  ? 'bg-emerald-500'
                  : 'bg-neutral-400 dark:bg-neutral-600'
              }`}
            />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-sm"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {step === 'email'
                ? 'Sign In to Your Workspace'
                : 'Enter Verification Code'}
            </h1>

            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {step === 'email'
                ? 'Enter your email to receive a 6-digit verification code'
                : `We sent a 6-digit code to ${email}`}
            </p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-[#14161b] border border-neutral-200 dark:border-white/[0.1] rounded-xl shadow-lg dark:shadow-2xl/40 overflow-hidden">
            {/* Form */}
            <form
              onSubmit={step === 'email' ? handleSendCode : handleVerifyCode}
              className="p-5 sm:p-6 space-y-4"
            >
              {step === 'email' ? (
                <>
                  {/* Email */}
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
                        autoComplete="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 text-xs bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-2.5 rounded-lg bg-neutral-500/5 border border-neutral-200 dark:border-white/[0.06] text-neutral-500 dark:text-neutral-400 text-xs">
                    We'll send a 6-digit verification code to your email.
                  </div>
                </>
              ) : (
                <>
                  {/* OTP */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                      Verification Code
                    </label>

                    <input
                      id="auth-screen-otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      required
                      autoFocus
                      placeholder="123456"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      className="w-full py-3 px-4 text-center text-lg tracking-[0.4em] font-semibold bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                    />
                  </div>

                  {/* Change Email */}
                  <button
                    type="button"
                    onClick={handleChangeEmail}
                    className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Change email
                  </button>
                </>
              )}

              {/* Error */}
              {error && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight">{error}</span>
                </div>
              )}

              {/* Message */}
              {message && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight">{message}</span>
                </div>
              )}

              {/* Submit */}
              <button
                id="auth-screen-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      {step === 'email'
                        ? 'Sending Code...'
                        : 'Verifying...'}
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {step === 'email'
                        ? 'Send Verification Code'
                        : 'Verify & Sign In'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Resend */}
              {step === 'otp' && (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="w-full text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  Resend verification code
                </button>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
