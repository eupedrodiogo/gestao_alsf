import React, { useEffect, useState } from 'react';
import { Wifi, ExternalLink, ShieldCheck, Activity, Users, AlertTriangle } from 'lucide-react';

export const MissionControl = () => {
    const [time, setTime] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-sans selection:bg-emerald-500/30">
            <div className="max-w-5xl w-full bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-700">
                {/* Header */}
                <div className="bg-emerald-600 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-2xl">
                            <Wifi className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                                Servidor da Missão
                            </h1>
                            <p className="text-emerald-100 text-sm opacity-90">Painel de Controle do Coordenador</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">Tempo de Execução</p>
                            <p className="text-xl font-mono font-medium">{time}</p>
                        </div>
                        <div className="bg-white/20 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 animate-pulse shadow-lg">
                            <span className="w-2 h-2 bg-white rounded-full"></span>
                            ONLINE
                        </div>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* Left Column: Connection Info */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-slate-400 text-sm uppercase tracking-wider font-bold mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Status da Conectividade
                            </h2>

                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl border border-slate-700 shadow-inner relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Wifi className="w-32 h-32" />
                                </div>

                                <div className="relative z-10 space-y-8">
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Rede Wi-Fi (Hotspot)</p>
                                        <p className="text-4xl md:text-5xl font-mono text-emerald-400 font-bold tracking-tight">MissaoLSF</p>
                                    </div>

                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Senha de Acesso</p>
                                        <div className="inline-flex bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50">
                                            <p className="text-2xl font-mono text-white tracking-widest">missao2024</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-700/50 pt-6 mt-2">
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Endereço para Tablets (Chrome)</p>
                                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between group-hover:border-yellow-500/30 transition-colors">
                                            <p className="text-xl md:text-2xl font-mono text-yellow-400 font-bold break-all">
                                                http://192.168.137.1:5000
                                            </p>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            Importante: Digite exatamente conforme acima (sem https)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Instructions & Actions */}
                    <div className="flex flex-col justify-between space-y-8">
                        <div className="bg-blue-600/5 border border-blue-500/20 p-8 rounded-3xl">
                            <h3 className="font-bold text-blue-400 mb-6 text-xl flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Instruções para a Equipe
                            </h3>
                            <ul className="space-y-4 text-slate-300">
                                <li className="flex gap-4 items-start">
                                    <span className="bg-blue-500/20 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-blue-400 shrink-0 mt-0.5">1</span>
                                    <span className="leading-relaxed">Mantenha este laptop ligado e conectado na tomada. <strong>Não feche</strong> a janela preta do servidor.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <span className="bg-blue-500/20 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-blue-400 shrink-0 mt-0.5">2</span>
                                    <span className="leading-relaxed">Peça para os voluntários conectarem os tablets na rede Wi-Fi <strong>MissaoLSF</strong>.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <span className="bg-blue-500/20 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-blue-400 shrink-0 mt-0.5">3</span>
                                    <span className="leading-relaxed">Se o sistema travar em algum tablet, peça para recarregar a página (F5 ou puxar para baixo).</span>
                                </li>
                            </ul>
                        </div>

                        <div className="grid gap-4">
                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full py-5 bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] shadow-lg"
                            >
                                <ExternalLink className="w-5 h-5 text-emerald-400" />
                                Abrir Sistema Administrativo (Neste Laptop)
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-950 p-4 md:p-6 text-center border-t border-slate-800">
                    <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Para finalizar a operação, execute o arquivo <strong>FINALIZAR-MISSAO.bat</strong> na Área de Trabalho.
                    </p>
                </div>
            </div>
        </div>
    );
};
