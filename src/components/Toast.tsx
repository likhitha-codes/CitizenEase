/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { Toast } from '../types';

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

export default function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="toast-container max-w-sm w-full fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  key?: string;
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto remove after 5s
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />,
    },
    error: {
      bg: 'bg-red-50 border-red-200 text-red-800',
      icon: <XCircle className="w-5 h-5 text-red-600 shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
    },
  }[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border clay-card ${config.bg} max-w-md w-full`}
      style={{ boxShadow: '0 10px 15px -3px rgba(0, 51, 102, 0.08)' }}
    >
      {config.icon}
      <div className="flex-1 text-sm font-medium pr-2">
        {toast.message}
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
