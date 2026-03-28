import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'success', isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={18} />,
    error: <XCircle className="text-red-500" size={18} />,
    info: <Info className="text-blue-500" size={18} />,
  };

  const bgColors = {
    success: 'bg-emerald-500/10 border-emerald-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    info: 'bg-blue-500/10 border-blue-500/20',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className={`fixed bottom-24 left-1/2 z-[200] flex w-[90%] max-w-xs -translate-x-1/2 items-center justify-between rounded-2xl border p-4 backdrop-blur-xl shadow-2xl ${bgColors[type]}`}
        >
          <div className="flex items-center gap-3">
            {icons[type]}
            <span className="text-xs font-bold text-white">{message}</span>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1 text-white/20 hover:bg-white/5 hover:text-white transition-all"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
