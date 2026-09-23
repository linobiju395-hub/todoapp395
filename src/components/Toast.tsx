import { motion, AnimatePresence } from 'motion/react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div id="toast-container" className="fixed bottom-4 right-4 z-50 flex flex-col gap-1.5 pointer-events-none max-w-xs w-full">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-auto flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg border bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-800 dark:border-neutral-200 shadow-lg text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              {t.type === 'success' && <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600 shrink-0" />}
              {t.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400 dark:text-rose-600 shrink-0" />}
              {t.type === 'info' && <Info className="w-3.5 h-3.5 opacity-60 shrink-0" />}
              <span className="font-medium truncate">{t.message}</span>
            </div>
            <button
              id={`dismiss-toast-${t.id}`}
              onClick={() => onDismiss(t.id)}
              className="opacity-50 hover:opacity-100 p-0.5 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
