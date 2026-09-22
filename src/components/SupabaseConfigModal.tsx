import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Database,
  Check,
  Copy,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  saveSupabaseCredentials,
  getSupabaseCredentials,
  clearSupabaseCredentials,
  checkSupabaseConnection,
  SUPABASE_SQL_SCHEMA,
} from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export function SupabaseConfigModal({
  isOpen,
  onClose,
  onConfigUpdated,
}: SupabaseConfigModalProps) {
  const currentConfig = getSupabaseCredentials();
  const [url, setUrl] = useState(currentConfig?.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig?.anonKey || '');
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    tableExists?: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAndTest = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter both the Project URL and anon public key.',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    saveSupabaseCredentials(url.trim(), anonKey.trim());
    const res = await checkSupabaseConnection();

    setTesting(false);
    setTestResult(res);

    if (res.success) {
      onConfigUpdated();
    }
  };

  const handleResetToLocal = () => {
    clearSupabaseCredentials();
    setUrl('');
    setAnonKey('');
    setTestResult({
      success: true,
      message: 'Switched to offline local storage.',
    });
    onConfigUpdated();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.12 }}
          className="relative w-full max-w-xl bg-white dark:bg-[#14161b] border border-neutral-200 dark:border-white/[0.1] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-neutral-500" />
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Supabase Connection
              </h2>
            </div>
            <button
              id="close-supabase-modal"
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Step 1: SQL Schema */}
            <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/80 dark:border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                  1. Database Schema
                </span>
                <button
                  id="copy-sql-schema-btn"
                  type="button"
                  onClick={handleCopySchema}
                  className="flex items-center gap-1 px-2 py-0.5 text-xs text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-white/[0.06] border border-neutral-200 dark:border-white/[0.1] rounded transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500 text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="text-[11px]">Copy SQL</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Run this table schema in your{' '}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-neutral-900 dark:hover:text-white inline-flex items-center gap-0.5"
                >
                  Supabase SQL Editor
                  <ExternalLink className="w-3 h-3 inline" />
                </a>{' '}
                to create the tasks table:
              </p>

              <pre className="p-2.5 rounded bg-neutral-100 dark:bg-black/40 text-[11px] font-mono text-neutral-700 dark:text-neutral-300 overflow-x-auto border border-neutral-200 dark:border-white/[0.06]">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>

            {/* Step 2: Credentials */}
            <div className="space-y-3">
              <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                2. API Credentials
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Project URL
                </label>
                <input
                  id="supabase-url-input"
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Anon Public Key
                </label>
                <input
                  id="supabase-key-input"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-50 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-400"
                />
              </div>
            </div>

            {/* Test Status Banner */}
            {testResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                  testResult.success && testResult.tableExists !== false
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400'
                }`}
              >
                {testResult.success && testResult.tableExists !== false ? (
                  <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-100 dark:border-white/[0.06] bg-neutral-50/50 dark:bg-white/[0.02]">
            <button
              id="use-local-mode-btn"
              type="button"
              onClick={handleResetToLocal}
              className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 transition-colors cursor-pointer"
            >
              Reset to local
            </button>

            <div className="flex items-center gap-2">
              <button
                id="cancel-supabase-config-btn"
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                id="save-and-connect-supabase-btn"
                type="button"
                onClick={handleSaveAndTest}
                disabled={testing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 rounded transition-colors disabled:opacity-50 cursor-pointer"
              >
                {testing && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>{testing ? 'Testing...' : 'Save & Connect'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
