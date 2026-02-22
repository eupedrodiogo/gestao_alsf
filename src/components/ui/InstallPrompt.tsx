import React, { useState, useEffect } from 'react';
import { Download, X, ShieldCheck, Smartphone, Monitor } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);

            // Show the prompt after a small delay to feel more natural
            setTimeout(() => {
                setIsVisible(true);
            }, 3000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // We've used the prompt, and can't use it again
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-[400px] z-[9999] animate-slide-in-bottom">
            <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-2xl overflow-hidden relative group">
                {/* Accent line */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-[#00d1c1] to-emerald-500" />

                <div className="p-6">
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-start gap-5">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100 ring-4 ring-indigo-50">
                            <Smartphone className="w-7 h-7 text-white" />
                        </div>

                        <div className="flex-1 pr-6">
                            <h3 className="text-lg font-black text-slate-800 leading-tight mb-1">
                                Experiência Completa
                            </h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                Instale o aplicativo oficial da ALSF para acesso offline e notificações em tempo real.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-3">
                        <button
                            onClick={handleInstall}
                            className="flex-1 bg-[#1a2c27] hover:bg-[#243b35] text-white py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/10 active:scale-95 group/btn"
                        >
                            <Download className="w-4 h-4 group-hover/btn:bounce" />
                            INSTALAR AGORA
                        </button>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-4 py-2 border-t border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Seguro e Verificado
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                .group\\/btn:hover .bounce {
                    animation: bounce 0.6s infinite;
                }
            `}</style>
        </div>
    );
};
