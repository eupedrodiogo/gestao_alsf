import React from 'react';
import {
    CheckCircle,
    AlertTriangle,
    Bell,
    X
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    description?: string;
}

interface ToastContainerProps {
    toasts: Toast[];
    removeToast: (id: string) => void;
}

export const ToastContainer = ({ toasts, removeToast }: ToastContainerProps) => (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none items-end">
        {toasts.map(toast => (
            <div
                key={toast.id}
                className={`
          pointer-events-auto flex items-start gap-4 p-4 pl-5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border w-[380px] animate-slide-in-right transition-all duration-300 transform hover:-translate-x-1
          ${toast.type === 'success' ? 'bg-white/95 border-emerald-100/50 backdrop-blur-xl' :
                        toast.type === 'error' ? 'bg-white/95 border-rose-100/50 backdrop-blur-xl' :
                            toast.type === 'warning' ? 'bg-white/95 border-amber-100/50 backdrop-blur-xl' :
                                'bg-white/95 border-blue-100/50 backdrop-blur-xl'}
        `}
            >
                <div className={`
          p-2.5 rounded-xl shrink-0 shadow-sm
          ${toast.type === 'success' ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600' :
                        toast.type === 'error' ? 'bg-gradient-to-br from-rose-100 to-rose-50 text-rose-600' :
                            toast.type === 'warning' ? 'bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600' :
                                'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600'}
        `}>
                    {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
                    {toast.type === 'error' && <AlertTriangle className="w-5 h-5" />}
                    {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                    {toast.type === 'info' && <Bell className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                    <h4 className="font-bold text-sm text-slate-800 leading-tight mb-1">{toast.message}</h4>
                    {toast.description && <p className="text-xs text-slate-500 leading-snug font-medium">{toast.description}</p>}
                </div>
                <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100/50 rounded-lg transition-colors -mr-2 -mt-2">
                    <X className="w-4 h-4" />
                </button>
            </div>
        ))}
    </div>
);
