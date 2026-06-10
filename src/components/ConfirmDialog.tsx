/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDanger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fade-in animate-duration-150">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-150 overflow-hidden transform transition-all scale-100 flex flex-col custom-shadow"
        id="confirm-dialog-container"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${isDanger ? 'text-rose-500' : 'text-amber-500'}`} />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            id="btn-close-confirm-dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">
            {message}
          </p>
        </div>

        {/* Actions Footer */}
        <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 transition-colors cursor-pointer"
            id="btn-cancel-confirm"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              isDanger 
                ? 'bg-rose-600 hover:bg-rose-700 border border-rose-600' 
                : 'bg-slate-900 hover:bg-slate-800 border border-slate-900'
            }`}
            id="btn-confirm-action"
          >
            {isDanger && <Trash2 className="w-3.5 h-3.5" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
