'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, MessageCircle, Mail } from 'lucide-react';

export type ToastType = 'whatsapp' | 'email' | 'error' | 'success';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    whatsapp: { icon: MessageCircle, bg: '#dcfce7', border: '#86efac', text: '#15803d', iconColor: '#25D366' },
    email:    { icon: Mail,          bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8', iconColor: '#3b82f6' },
    error:    { icon: XCircle,       bg: '#fee2e2', border: '#fca5a5', text: '#b91c1c', iconColor: '#ef4444' },
    success:  { icon: CheckCircle,   bg: '#dcfce7', border: '#86efac', text: '#15803d', iconColor: '#16a34a' },
  };

  const { icon: Icon, bg, border, text, iconColor } = config[type];

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border max-w-sm"
      style={{ background: bg, borderColor: border, animation: 'toastIn 0.3s ease' }}
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: iconColor + '22' }}>
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: text }}>{message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 ml-1 flex-shrink-0"
      >
        ✕
      </button>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
