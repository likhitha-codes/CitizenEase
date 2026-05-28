/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm & Download'
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop screen */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gov-navy/40 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="relative bg-white border border-gov-border rounded-xl shadow-xl max-w-md w-full p-6 text-left z-10 clay-card"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gov-warning/10 text-gov-warning flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-gov-warning" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gov-navy font-sans leading-snug">
                  {title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wider font-semibold">
                  Official Verification Check
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              {message}
            </p>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gov-border text-gray-500 hover:bg-gray-50 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-5 py-2 bg-gov-orange hover:bg-gov-orange/90 text-gov-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-sm"
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
