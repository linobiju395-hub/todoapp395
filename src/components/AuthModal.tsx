import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Database,
  ArrowLeft,
} from 'lucide-react';
import { sendOtp, verifyOtp } from '../lib/auth';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  isSupabaseConnected: boolean;
}

export function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  isSupabaseConnected,
}: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setMessage(null);

    const cleanEmail = email.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await sendOtp(cleanEmail);

      if (!res.success) {
        setError(res.error || 'Failed to send verification code.');
        return;
      }

      setStep('otp');
      setMessage(`A 6-digit verification code was sent to ${cleanEmail}.`);
    } catch (err: any) {
      setError(
        err?.message || 'Failed to send verification code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setMessage(null);

    const cleanCode = code.trim();

    if (!/^\d{6}$/.test(cleanCode)) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      const res = await verifyOtp(email.trim(), cleanCode);

      if (res.error) {
        setError(res.error);
        return;
      }

      if (res.user) {
        setMessage('Verification successful!');

        onAuthSuccess(res.user);

        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err: any) {
      setError(
        err?.message || 'Verification failed. Please check your code.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setCode('');
    setError(null);
    setMessage(null);
  };

  const handleClose = () => {
    setEmail('');
    setCode('');
    setStep('email');
    setError(null);
    setMessage(null);
    onClose();
  };

  const handleResend = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await sendOtp(email.trim());

      if (!res.success) {
        setError(res.error || 'Failed to resend verification code.');
        return;
      }

      setMessage('A new 6-digit verification code has been sent.');
    } catch (err: any) {
      setError(
        err?.message || 'Failed to resend verification code.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.12 }}
          className="relative w-full max-w-sm bg-white dark:bg-[#14161b] border border-neutral-200 dark:border-white/[0.1] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              {step === 'otp' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
              ) : (
                <Mail className="w-3.5 h-3.5 text-neutral-500" />
              )}

              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                {step === 'email'
                  ? 'Sign In to Account'
                  : 'Verify Your Email'}
              </h3>
            </div>

            <button
              onClick={handleClose}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Back button */}
          {step === 'otp' && (
            <div className="px-5 pt-3">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Change email</span>
              </button>
            </div>
          )}

          {/* Form */}
          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="p-5 space-y-3.5">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                  Enter your email address and we'll send you a 6-digit
                  verification code.
                </p>

                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  Email Address
                </label>

                <div className="relative flex items-center">
                  <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />

                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-400"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-2 rounded border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success */}
              {message && (
                <div className="p-2 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{message}</span>
                </div>
              )}

              {/* Send Code */}
              <button
                id="auth-send-code-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading && (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                )}

                <span>
                  {loading ? 'Sending Code...' : 'Send Verification Code'}
                </span>
              </button>

              {/* Supabase status */}
              <div className="pt-2 text-center flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                <Database className="w-3 h-3" />

                <span>
                  {isSupabaseConnected
                    ? 'Protected with Supabase Auth'
                    : 'Supabase connection unavailable'}
                </span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="p-5 space-y-3.5">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                  Enter the 6-digit code sent to:
                  <br />
                  <strong className="text-neutral-700 dark:text-neutral-200">
                    {email}
                  </strong>
                </p>

                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  Verification Code
                </label>

                <div className="relative flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />

                  <input
                    id="auth-otp-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    autoFocus
                    placeholder="123456"
                    value={code}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 6);

                      setCode(value);
                    }}
                    className="w-full pl-8 pr-3 py-2 text-sm tracking-[0.35em] font-semibold bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-400"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-2 rounded border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success */}
              {message && (
                <div className="p-2 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{message}</span>
                </div>
              )}

              {/* Verify */}
              <button
                id="auth-verify-code-btn"
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading && (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                )}

                <span>
                  {loading ? 'Verifying...' : 'Verify & Sign In'}
                </span>
              </button>

              {/* Resend */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-[11px] text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Didn't receive the code? Resend
                </button>
              </div>

              {/* Supabase status */}
              <div className="pt-2 text-center flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                <Database className="w-3 h-3" />

                <span>
                  {isSupabaseConnected
                    ? 'Protected with Supabase Auth'
                    : 'Supabase connection unavailable'}
                </span>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
