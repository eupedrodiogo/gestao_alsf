import React, { useState, useMemo } from 'react';
import {
    LayoutDashboard, MapPin, Activity, Users, Package, Calendar,
    TrendingUp, Globe, Target, CheckCircle2, Clock, XCircle,
    ChevronRight, Waves, Building2, Ship, Heart, Star,
    Filter, Search, LogOut, Bell, BarChart3, ArrowUpRight,
    ArrowDownRight, Minus, Eye, ChevronDown, ChevronUp,
    Zap, Shield, Award, Map, Info, AlertCircle, Share2, Printer, DollarSign,
    Sun, Moon, Menu, X, Sparkles, ArrowRight, FileText, Download,
    ShieldCheck, FileCheck, ShieldAlert
} from 'lucide-react';
import { useFirestore } from '../api/useFirestore';
import { useAuth } from '../context/AuthContext';
import type { Mission, Volunteer, Item } from '../types/index';

// ─── UNIDADES DA REDE ALSF (ESTÁTICO) ──────────────────────────────────────────
const ALSF_UNITS = [
    { id: 'u1', shortName: 'HSFA-RJ', fullName: 'Hosp. São Francisco de Assis', city: 'Rio de Janeiro', state: 'RJ', type: 'hospital', icon: '🏥', color: '#3b82f6', coords: { x: '75%', y: '80%' }, beds: 300 },
    { id: 'u2', shortName: 'HRSP-SP', fullName: 'Hosp. Regional São Pedro', city: 'Mirassol', state: 'SP', type: 'hospital', icon: '🏥', color: '#10b981', coords: { x: '68%', y: '78%' }, beds: 220 },
    { id: 'u3', shortName: 'HNMD-SP', fullName: 'Hosp. N. Sra. Mãe da Divina Providência', city: 'São Paulo', state: 'SP', type: 'hospital', icon: '🏥', color: '#8b5cf6', coords: { x: '70%', y: '81%' }, beds: 120 },
    { id: 'u4', shortName: 'HLID-SP', fullName: 'Hosp.-Lar Irmã Dulce', city: 'Pirajuí', state: 'SP', type: 'ilp', icon: '🏡', color: '#f43f5e', coords: { x: '67%', y: '79%' }, beds: 80 },
    { id: 'u7', shortName: 'BH-PAPA', fullName: 'Barco Hosp. Papa Francisco', city: 'Óbidos', state: 'AM', type: 'barco', icon: '⛵', color: '#06b6d4', coords: { x: '40%', y: '35%' }, beds: 32 },
    { id: 'u8', shortName: 'BH-JOÃO', fullName: 'Barco Hosp. São João XXIII', city: 'Almeirim', state: 'AM', type: 'barco', icon: '⛵', color: '#14b8a6', coords: { x: '45%', y: '32%' }, beds: 32 },
];

// ─── COMPONENTES AUXILIARES ───────────────────────────────────────────────────

const StatCard = ({ label, value, sub, icon, color, trend, theme }: any) => (
    <div className={`rounded-2xl p-4 relative overflow-hidden group transition-all duration-300 border ${theme === 'dark'
        ? 'bg-slate-900/60 border-slate-800 hover:border-amber-500/30 shadow-2xl'
        : 'bg-white border-slate-200 hover:border-amber-500 shadow-lg shadow-slate-200/50'
        }`}>
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-[0.05] -mr-8 -mt-8 rounded-full`} />
        <div className="flex items-center justify-between mb-3 relative z-10">
            <div className={`p-2 rounded-lg transition-transform group-hover:scale-110 ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-600'
                }`}>
                {icon}
            </div>
            {trend && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trend > 0
                    ? (theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-200')
                    : (theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-rose-500 text-white shadow-lg shadow-rose-200')
                    }`}>
                    {trend > 0 ? '+' : ''}{trend}%
                </span>
            )}
        </div>
        <h3 className={`text-2xl font-black tracking-tight relative z-10 ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{value}</h3>
        <p className={`text-[10px] font-black uppercase tracking-wider mt-1 relative z-10 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{label}</p>
        <p className={`text-[9px] mt-0.5 relative z-10 font-medium ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>{sub}</p>
    </div>
);

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────

export const PresidentDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const { data: missions, updateItem: updateMission } = useFirestore<Mission>('missions');
    const { data: volunteers } = useFirestore<Volunteer>('volunteers');
    const { data: items } = useFirestore<Item>('items');

    const [evaluatingMissionId, setEvaluatingMissionId] = useState<string | null>(null);
    const [evalBudget, setEvalBudget] = useState<string>('');
    const [evalObservation, setEvalObservation] = useState('');

    const handleApproveMission = async (missionId: string, status: 'approved' | 'rejected') => {
        try {
            // Find in data, mock or real
            const allMissions = missions?.length ? missions : displayMissions;
            const mission = allMissions.find(m => m.id === missionId);
            if (!mission) return;

            const updatedBudget = parseFloat(evalBudget) || 0;
            const updates = {
                approvalStatus: status,
                presidentObservation: evalObservation,
                financial: {
                    ...(mission.financial || { expenses: [] }),
                    budget: updatedBudget,
                }
            };

            if (!missionId.startsWith('m')) {
                await updateMission(missionId, updates);
            } else {
                alert('Modo de demonstração: Crie uma missão real para testar o salvamento em banco.');
            }

            setEvaluatingMissionId(null);
            setEvalBudget('');
            setEvalObservation('');

        } catch (error) {
            console.error("Erro ao avaliar missão:", error);
            alert("Erro ao avaliar missão.");
        }
    };

    const [activeView, setActiveView] = useState('dashboard');
    const [activeUnit, setActiveUnit] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        return (localStorage.getItem('president-theme') as 'dark' | 'light') || 'dark';
    });

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('president-theme', newTheme);
    };

    // Mock Data para garantir que o painel esteja sempre "vivo"
    const displayMissions = missions?.length ? missions : [
        { id: 'm1', title: 'Expedição Ribeirinha Calha Norte', date: '2026-02-25', status: 'planned', description: 'Atendimento médico e odontológico em 12 comunidades do Amazonas.', volunteerIds: Array(15), beneficiaryIds: Array(450), financial: { budget: 45000 } },
        { id: 'm2', title: 'Inverno Solidário - Mirassol', date: '2026-03-10', status: 'planned', description: 'Distribuição de agasalhos e sopa para população de rua.', volunteerIds: Array(8), beneficiaryIds: Array(120), financial: { budget: 12000 } },
        { id: 'm3', title: 'Mutirão Oftalmológico HSFA-RJ', date: '2026-02-15', status: 'completed', description: 'Realização de 200 cirurgias de catarata represadas.', volunteerIds: Array(25), beneficiaryIds: Array(212), financial: { budget: 180000, expenses: [{ value: 175000 }] } },
    ] as any[];

    const unitsWithMissions = useMemo(() => {
        return ALSF_UNITS.map(unit => {
            const count = displayMissions.filter(m =>
                m.status === 'planned' &&
                (m.title.includes(unit.shortName) || m.description.includes(unit.shortName) || m.description.includes(unit.fullName))
            ).length;
            return { ...unit, activeMissions: count };
        });
    }, [displayMissions]);

    // Live Impact Simulator
    const [liveCounter, setLiveCounter] = useState(0);
    React.useEffect(() => {
        const interval = setInterval(() => {
            setLiveCounter(prev => prev + Math.floor(Math.random() * 3));
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    const stats = useMemo(() => {
        const active = displayMissions.filter(m => m.status === 'planned').length;
        const beds = ALSF_UNITS.reduce((acc, u) => acc + u.beds, 0);
        const vols = volunteers?.length || 1420;

        // Calcular impacto real baseado nas missões concluídas
        const completedMissions = displayMissions.filter(m => m.status === 'completed');
        const impactFromMissions = completedMissions.reduce((acc, m) => acc + (m.beneficiaryIds?.length || 0), 0);
        const totalImpact = 48500 + impactFromMissions + liveCounter; // Base + real + live simulated

        return {
            activeMissions: active,
            totalBeds: beds,
            activeVolunteers: vols,
            completedAcoes: completedMissions.length + 112, // Base + real
            impactPeople: totalImpact.toLocaleString('pt-BR'),
            monthlyBudget: 'R$ 2.4M'
        };
    }, [displayMissions, volunteers, liveCounter]);

    return (
        <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 ${theme === 'dark' ? 'bg-[#020617] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>

            {/* SIDEBAR EXCLUSIVA PRESIDENTE */}
            <aside className={`hidden lg:flex lg:flex-col lg:w-64 lg:items-stretch lg:py-6 lg:px-4 lg:border-r ${theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-2xl'}`}>
                <div className="flex flex-col gap-4 px-2 mb-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl p-2 shadow-xl ${theme === 'dark' ? 'bg-white shadow-amber-500/10' : 'bg-slate-50 shadow-slate-200 border border-slate-100'}`}>
                                <img src="/logo alsf.webp" alt="ALSF" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h1 className={`font-black text-sm leading-tight tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>ALSF</h1>
                                <p className="text-amber-500 text-[9px] font-bold tracking-[0.2em] uppercase mt-0.5">Providência de Deus</p>
                            </div>
                        </div>
                        <button
                            className="lg:hidden p-2 text-slate-500"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className={`flex items-center gap-3 rounded-xl p-2.5 border pl-4 ml-6 relative ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className={`absolute -left-4 top-1/2 w-4 h-px ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-300'}`}></div>
                        <div className={`absolute -left-4 bottom-1/2 h-10 w-px border-l ${theme === 'dark' ? 'border-slate-800' : 'border-slate-300'}`}></div>
                        <div className={`w-10 h-10 rounded-lg p-1.5 shrink-0 flex items-center justify-center ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-sm border border-slate-100'}`}>
                            <img src="/logo fraternidade alsf.png" alt="Fraternidade" className="w-full h-full object-contain drop-shadow-md" />
                        </div>
                        <div className="flex-1">
                            <p className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Fraternidade</p>
                            <p className={`text-[9px] uppercase tracking-widest mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>São Francisco de Assis</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 space-y-1.5">
                    {[
                        { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'War Room Central' },
                        { id: 'map', icon: <Globe size={20} />, label: 'Mapa de Impacto' },
                        { id: 'clinical', icon: <Activity size={20} />, label: 'Dados Clínicos' },
                        { id: 'missions', icon: <Target size={20} />, label: 'Monitor de Missões' },
                        { id: 'reports', icon: <BarChart3 size={20} />, label: 'Relatórios Executivos' },
                        { id: 'compliance', icon: <Shield size={20} />, label: 'Compliance & Auditoria' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveView(item.id);
                                setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-95 ${activeView === item.id
                                ? (theme === 'dark' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-900/10' : 'bg-amber-500 text-white shadow-xl shadow-amber-200')
                                : (theme === 'dark' ? 'text-slate-500 hover:text-white hover:bg-slate-900' : 'text-slate-500 hover:text-slate-950 hover:bg-slate-50')}`}
                        >
                            {item.icon}
                            <span className="text-xs font-black tracking-tight">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="mt-auto border-t pt-6 transition-colors duration-500" style={{ borderColor: theme === 'dark' ? '#1e293b' : '#f1f5f9' }}>
                    <div className={`${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100 shadow-inner'} rounded-2xl p-4 border mb-4`}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Sincronização OK</span>
                        </div>
                        <p className={`text-[9px] leading-relaxed font-black ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Backup automático realizado às 14:40</p>
                    </div>
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3.5 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all active:scale-95">
                        <LogOut size={20} />
                        <span className="text-xs font-black tracking-tight">Encerrar Sessão</span>
                    </button>
                </div>
            </aside>

            {/* CONTEÚDO PRINCIPAL */}
            <main className="flex-1 flex flex-col overflow-hidden relative">

                {/* TOP BAR */}
                <header className={`h-16 lg:h-20 border-b flex items-center justify-between px-4 lg:px-8 backdrop-blur-md z-30 transition-all ${theme === 'dark' ? 'bg-slate-950/80 border-slate-900' : 'bg-white/90 border-slate-200 shadow-sm'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`lg:hidden w-10 h-10 rounded-xl p-1.5 flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-white' : 'bg-slate-50 border border-slate-100 shadow-sm'}`}>
                            <img src="/logo alsf.webp" alt="ALSF" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h2 className={`text-sm lg:text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                                {activeView === 'dashboard' && 'War Room Central'}
                                {activeView === 'map' && 'Mapa de Impacto Estratégico'}
                                {activeView === 'clinical' && 'Dados Clínicos e Rede'}
                                {activeView === 'missions' && 'Monitoramento de Missões'}
                                {activeView === 'reports' && 'Inteligência e Relatórios'}
                                {activeView === 'compliance' && 'Conformidade e Auditoria'}
                                <span className={`font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400 hidden sm:inline'}`}> — Comando ALSF</span>
                            </h2>
                            <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} lg:hidden`}>Presidente</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-6">
                        {/* TOGGLE THEME */}
                        <button
                            onClick={toggleTheme}
                            className={`flex items-center gap-2 px-2 py-1.5 lg:px-3 lg:py-2 rounded-xl border transition-all ${theme === 'dark'
                                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800 hover:border-slate-700'
                                : 'bg-white border-slate-200 text-amber-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
                                }`}
                        >
                            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                            <span className="text-[9px] font-black uppercase tracking-wider hidden sm:block">
                                {theme === 'dark' ? 'Modo Dia' : 'Modo Noite'}
                            </span>
                        </button>

                        <div className={`flex items-center gap-2 lg:gap-4 px-2 py-1 lg:px-4 lg:py-2 border rounded-2xl transition-colors ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                            }`}>
                            <div className="hidden sm:flex flex-col items-end">
                                <span className={`text-xs font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Frei Francisco</span>
                                <span className="text-[8px] lg:text-[10px] font-extrabold text-amber-500 uppercase tracking-tighter">Presidente</span>
                            </div>
                            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-xs lg:text-sm font-black shadow-lg">
                                FR
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-2">
                            <button className={`p-2 rounded-xl transition-all border ${theme === 'dark' ? 'text-slate-400 bg-slate-900 border-slate-800 hover:text-white' : 'text-slate-500 bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
                                }`}>
                                <Bell size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* DASHBOARD GRID */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-4 lg:space-y-8 scrollbar-hide pb-32 lg:pb-8">

                    {activeView === 'dashboard' && (
                        <div className="space-y-4 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* KPI ROW */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
                                <StatCard label="Missões Ativas" value={stats.activeMissions} sub="Em campo agora" icon={<Target size={18} />} color="from-blue-600 to-blue-400" trend={12} theme={theme} />
                                <StatCard label="Leitos Totais" value={stats.totalBeds} sub="Ocupação: 84%" icon={<Building2 size={18} />} color="from-emerald-600 to-emerald-400" theme={theme} />
                                <StatCard label="Voluntários" value={stats.activeVolunteers} sub="Rede nacional" icon={<Users size={18} />} color="from-violet-600 to-violet-400" trend={5} theme={theme} />
                                <StatCard label="Ações Concluídas" value={stats.completedAcoes} sub="Em 2026" icon={<CheckCircle2 size={18} />} color="from-amber-600 to-amber-400" theme={theme} />
                                <StatCard label="Impacto Direto" value={stats.impactPeople} sub="+8% mês anterior" icon={<Heart size={18} />} color="from-rose-600 to-rose-400" trend={8} theme={theme} />
                                <StatCard label="Orçamento Mensal" value={stats.monthlyBudget} sub="Giro operacional" icon={<TrendingUp size={18} />} color="from-indigo-600 to-indigo-400" theme={theme} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* RESUMO ESTRATÉGICO RÁPIDO NO LUGAR DO MAPA */}
                                <div className={`lg:col-span-3 rounded-[2.5rem] p-8 border transition-all duration-500 overflow-hidden relative ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                                <Globe className="w-8 h-8 text-amber-500 animate-pulse" />
                                            </div>
                                            <div>
                                                <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Visão Geográfica Ativa</h3>
                                                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Acesse o módulo completo para monitoramento em tempo real da rede.</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setActiveView('map')}
                                            className={`px-8 py-4 rounded-2xl text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-xl ${theme === 'dark' ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-950 hover:bg-black text-white shadow-slate-200'}`}
                                        >
                                            EXPANDIR MAPA DE IMPACTO
                                        </button>
                                    </div>
                                    <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
                                        <svg viewBox="0 0 1000 1000" className="w-full h-full text-amber-500 rotate-12 translate-x-20">
                                            <path fill="currentColor" d="M336.1,139.7c-5-18-20.2-26.2-40.4-36.4c-11.7-5.9-23.7-11.2-36.5-12.7c-21.7-2.6-43.7,1.1-65.7,1.8c-10.9,0.3-21.8-0.8-32.5-3c-13.8-2.8-28.7-2.3-41.2,5.2c-5.5,3.3-10,8.1-14.7,12.5c-4.3,4-8.8,7.7-13.5,11.2c-6.8,5-14.4,9.4-22,13c-14.6,7-30.1,12.1-44.6,19.3c-10.6,5.3-22.3,12-28.7,22.7c-2.4,4-4.2,8.6-4,13.2c0.3,5.9,4,11.1,8.3,15.1c8.4,7.8,17,15.4,26.4,21.8c9.9,6.7,21,11.7,31.7,17c13.7,6.8,26.6,15,36.9,26.2c4.4,4.7,8.2,10.2,12.8,14.6c11.9,11.3,28.4,14.3,38,28.4c4.6,6.8,8.2,14.6,13.1,21.4c6.2,8.6,14.7,14.9,23.5,20.5c15.8,10.1,32.7,18.4,47.8,29.3c15.1,10.9,27.8,25.4,36.5,41.4c9.4,17.4,14.9,35.7,25.4,52.2c12.2,19.2,28.6,35.4,45.7,50.7c17.1,15.3,37.3,27,53,44.9c10.4,11.9,17.1,26.4,24.8,40.1c11.2,19.9,23.1,39.3,38.1,56.7c10,11.6,22.7,20.3,36.2,26.8c15.7,7.6,33.1,10.2,50.3,13.6c14.7,2.9,29.4,6,43.7,10.6c15.8,5.1,30.8,13.6,41.9,26.4c7.6,8.7,12.9,19,18,29.4c17.5,35.5,34.8,71.1,52.5,106.5c3.3,6.7,7,14.4,13.2,18.8c7.4,5.3,17.5,5.1,26.3,2.4c16.2-5,32-12,47-19.9c13.2-6.9,26-14.7,39.8-20.7c15.1-6.6,31.1-12.8,47.4-12.2c13.8,0.5,27.1,5.5,40.6,8.6c13.5,3.1,27.3,4.4,41.1,4c15.7-0.5,31.8-3.4,46.1-9.9c8.2-3.7,15.6-9,22.8-14.4c12.6-9.6,24.3-20.5,31.3-34.7c4.1-8.3,6.2-17.5,6.5-26.8c0.8-21.7-5.5-43.2-8.5-64.7c-1.8-13.4-3.5-26.8-2.6-40.4c0.8-11.7,3.5-23.2,7.4-34.3c4.1-11.9,10-23-17-33.8c12.7-19.1,28.3-36.1,43-53.8c9.6-11.5,18.8-23.5,27.4-35.9c11.1-16,19.7-33.6,24.8-52c5.4-19.5,7.3-39.6,7-59.8c-0.2-11.7-1.4-23.3-3.6-34.8c-4.4-23-14.6-44.5-28.5-64c-13.8-19.4-31-36.8-49.8-51.4c-11.7-9.1-24.3-17.2-37.4-24.1c-15.7-8.3-32.3-15.1-49-21.6c-11.2-4.4-22.5-8.5-33.3-13.6c-13.7-6.5-26.8-14.7-41.2-19.5c-15.7-5.2-32.7-7-49.2-8.1c-22.7-1.5-45.5-1-68.3-0.8c-15.7,0.1-31.4,0.1-47.1-0.8c-12.7-0.7-25.4-2.8-38.1-4.2c-15.7-1.7-31.5-3-47.2-3.1C550.5,134.1,443.3,134.1,336.1,139.7z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* NOVA SEÇÃO: ATIVIDADE RECENTE E LOGÍSTICA */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* FEED DE AUDITORIA/ATIVIDADE */}
                                <div className={`lg:col-span-2 rounded-3xl p-6 border transition-all duration-500 ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
                                    }`}>
                                    <h3 className={`font-black mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                        <Activity className={`w-5 h-5 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
                                        Atividade Recente da Rede
                                    </h3>
                                    <div className="space-y-4">
                                        {[
                                            { unit: 'Barco Papa Francisco', action: 'Iniciou triagem em Alenquer', time: '12 min atrás', type: 'info' },
                                            { unit: 'Financeiro Central', action: 'Aporte de R$ 50.000 liberado para Missão Calha Norte', time: '1h atrás', type: 'success' },
                                            { unit: 'HSFA-RJ', action: 'Novo lote de suprimentos médicos recebido', time: '3h atrás', type: 'info' },
                                            { unit: 'Rede Voluntários', action: '15 novos membros integrados à base SP', time: '5h atrás', type: 'success' },
                                        ].map((log, i) => (
                                            <div key={i} className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all border ${theme === 'dark'
                                                ? 'hover:bg-slate-800/50 border-transparent hover:border-slate-800'
                                                : 'bg-white border-slate-100 hover:border-amber-200 hover:shadow-xl hover:shadow-slate-200/50'
                                                }`}>
                                                <div className={`w-1.5 h-10 rounded-full ${log.type === 'success' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]'}`} />
                                                <div className="flex-1">
                                                    <p className={`text-[11px] font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{log.unit}</p>
                                                    <p className={`text-[10px] font-medium leading-tight mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{log.action}</p>
                                                </div>
                                                <span className={`text-[9px] font-black uppercase tracking-tighter whitespace-nowrap ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>{log.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* RESUMO FINANCEIRO ESTRATÉGICO */}
                                <div className={`rounded-3xl p-6 border transition-all duration-500 ${theme === 'dark' ? 'bg-gradient-to-br from-amber-900/10 to-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'
                                    }`}>
                                    <h3 className={`font-black mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                        <DollarSign className={`w-5 h-5 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                                        Saúde Financeira
                                    </h3>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between items-end mb-2">
                                                <p className={`text-[10px] font-black uppercase ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Captação Mensal</p>
                                                <p className={`text-sm font-black ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>82% da Meta</p>
                                            </div>
                                            <div className={`h-2.5 rounded-full overflow-hidden p-[1px] ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100 shadow-inner'}`}>
                                                <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: '82%' }} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className={`p-4 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm shadow-slate-200/50'}`}>
                                                <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>Doações</p>
                                                <p className={`text-base font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>R$ 1.8M</p>
                                                <div className="flex items-center gap-1 text-[8px] text-emerald-500 font-bold mt-1">
                                                    <ArrowUpRight size={10} /> +15%
                                                </div>
                                            </div>
                                            <div className={`p-4 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm shadow-slate-200/50'}`}>
                                                <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>Despesas</p>
                                                <p className={`text-base font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>R$ 1.2M</p>
                                                <div className="flex items-center gap-1 text-[8px] text-amber-500 font-bold mt-1">
                                                    <ArrowDownRight size={10} /> -4%
                                                </div>
                                            </div>
                                        </div>
                                        <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-xl transition-all shadow-lg active:scale-95">
                                            AUDITAR FLUXO DE CAIXA
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* RODAPÉ ESTATÍSTICO */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                                <div className="bg-gradient-to-br from-indigo-900/20 to-slate-900 border border-slate-800 rounded-3xl p-6">
                                    <h4 className="text-xs font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                                        <Waves className="w-4 h-4 text-cyan-400" />
                                        Impacto Rio Amazonas
                                    </h4>
                                    <div className="flex items-end gap-6">
                                        <div className="flex-1 space-y-4">
                                            {[
                                                { label: 'Comunidades Atendidas', value: 42, color: 'bg-cyan-500' },
                                                { label: 'Cirurgias em Barcos', value: 312, color: 'bg-teal-500' },
                                                { label: 'Medicação Distribuída', value: '1,2k', color: 'bg-blue-500' }
                                            ].map((sh, idx) => (
                                                <div key={idx}>
                                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                                                        <span>{sh.label}</span>
                                                        <span className="text-white">{sh.value}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className={`h-full ${sh.color} rounded-full`} style={{ width: '70%' }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="w-24 h-24 shrink-0 rounded-3xl bg-slate-950 p-2 flex flex-col items-center justify-center border border-slate-800 shadow-2xl">
                                            <Ship className="w-8 h-8 text-cyan-500 mb-1" />
                                            <span className="text-[8px] font-black text-slate-500 uppercase">2 Barcos</span>
                                            <span className="text-[10px] font-black text-emerald-500">ATIVOS</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-slate-800 rounded-3xl p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-xs font-black text-white mb-1 uppercase tracking-widest flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                                Crescimento da Rede
                                            </h4>
                                            <p className="text-[10px] text-slate-500">Aumento de leitos e capacidade assistencial</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-emerald-400">+12%</p>
                                            <p className="text-[9px] text-slate-500 font-bold">vs 2025</p>
                                        </div>
                                    </div>
                                    <div className="h-28 flex items-end gap-2 px-2">
                                        {[30, 45, 35, 60, 55, 80, 75, 95].map((h, i) => (
                                            <div key={i} className="flex-1 bg-gradient-to-t from-emerald-600/40 to-emerald-400 rounded-t-sm transition-all hover:scale-105 hover:opacity-80 cursor-help" style={{ height: `${h}%` }} title={`Mês ${i + 1}: ${h}%`} />
                                        ))}
                                    </div>
                                    <div className="flex justify-between mt-2 px-2">
                                        <span className="text-[8px] font-bold text-slate-600">JAN/25</span>
                                        <span className="text-[8px] font-bold text-slate-600">AGO/25</span>
                                        <span className="text-[8px] font-bold text-slate-600">ATUAL</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeView === 'map' && (
                        <div className="h-full flex flex-col space-y-6 animate-in fade-in zoom-in-95 duration-1000">
                            <div className={`flex-1 min-h-[600px] rounded-[2.5rem] p-6 lg:p-10 relative overflow-hidden border transition-all duration-700 ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-2xl shadow-slate-200/50'}`}>
                                {/* BACKGROUND DECORATIVE (SUTIL) */}
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                                    <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} />
                                </div>

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-lg shadow-amber-500/5">
                                                    <Globe className="w-6 h-6 text-amber-500 animate-[spin_10s_linear_infinite]" />
                                                </div>
                                                <div>
                                                    <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Mapa de Impacto Estratégico</h2>
                                                    <p className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Monitoramento de Ativos • Rede Nacional ALSF</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className={`p-4 rounded-[2rem] border backdrop-blur-md transition-all flex flex-col items-center min-w-[120px] ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
                                                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Pessoas/Ano</p>
                                                <p className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>242.8k</p>
                                            </div>
                                            <div className={`p-4 rounded-[2rem] border backdrop-blur-md transition-all flex flex-col items-center min-w-[120px] ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
                                                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Eficiência</p>
                                                <p className={`text-xl font-black text-emerald-500`}>98.4%</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* MAP CONTAINER FULL WIDTH/HEIGHT */}
                                    <div className="flex-1 relative flex items-center justify-center p-4 lg:p-10 border border-slate-800/5 rounded-[3rem] bg-slate-400/5 overflow-hidden">
                                        {/* GRID LINES SUTILÍSSIMAS */}
                                        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 pointer-events-none opacity-[0.03]">
                                            {[...Array(36)].map((_, i) => (
                                                <div key={i} className="border-[0.5px] border-white" />
                                            ))}
                                        </div>

                                        {/* SVG BRASIL GIGANTE */}
                                        <svg viewBox="0 0 1000 1000" className={`w-full h-full max-h-[700px] absolute transition-all duration-1000 pointer-events-none drop-shadow-[0_0_50px_rgba(0,0,0,0.1)] ${theme === 'dark' ? 'opacity-[0.1] text-white' : 'opacity-[0.15] text-slate-400'}`}>
                                            <path
                                                fill="currentColor"
                                                d="M336.1,139.7c-5-18-20.2-26.2-40.4-36.4c-11.7-5.9-23.7-11.2-36.5-12.7c-21.7-2.6-43.7,1.1-65.7,1.8c-10.9,0.3-21.8-0.8-32.5-3c-13.8-2.8-28.7-2.3-41.2,5.2c-5.5,3.3-10,8.1-14.7,12.5c-4.3,4-8.8,7.7-13.5,11.2c-6.8,5-14.4,9.4-22,13c-14.6,7-30.1,12.1-44.6,19.3c-10.6,5.3-22.3,12-28.7,22.7c-2.4,4-4.2,8.6-4,13.2c0.3,5.9,4,11.1,8.3,15.1c8.4,7.8,17,15.4,26.4,21.8c9.9,6.7,21,11.7,31.7,17c13.7,6.8,26.6,15,36.9,26.2c4.4,4.7,8.2,10.2,12.8,14.6c11.9,11.3,28.4,14.3,38,28.4c4.6,6.8,8.2,14.6,13.1,21.4c6.2,8.6,14.7,14.9,23.5,20.5c15.8,10.1,32.7,18.4,47.8,29.3c15.1,10.9,27.8,25.4,36.5,41.4c9.4,17.4,14.9,35.7,25.4,52.2c12.2,19.2,28.6,35.4,45.7,50.7c17.1,15.3,37.3,27,53,44.9c10.4,11.9,17.1,26.4,24.8,40.1c11.2,19.9,23.1,39.3,38.1,56.7c10,11.6,22.7,20.3,36.2,26.8c15.7,7.6,33.1,10.2,50.3,13.6c14.7,2.9,29.4,6,43.7,10.6c15.8,5.1,30.8,13.6,41.9,26.4c7.6,8.7,12.9,19,18,29.4c17.5,35.5,34.8,71.1,52.5,106.5c3.3,6.7,7,14.4,13.2,18.8c7.4,5.3,17.5,5.1,26.3,2.4c16.2-5,32-12,47-19.9c13.2-6.9,26-14.7,39.8-20.7c15.1-6.6,31.1-12.8,47.4-12.2c13.8,0.5,27.1,5.5,40.6,8.6c13.5,3.1,27.3,4.4,41.1,4c15.7-0.5,31.8-3.4,46.1-9.9c8.2-3.7,15.6-9,22.8-14.4c12.6-9.6,24.3-20.5,31.3-34.7c4.1-8.3,6.2-17.5,6.5-26.8c0.8-21.7-5.5-43.2-8.5-64.7c-1.8-13.4-3.5-26.8-2.6-40.4c0.8-11.7,3.5-23.2,7.4-34.3c4.1-11.9,10-23-17-33.8c12.7-19.1,28.3-36.1,43-53.8c9.6-11.5,18.8-23.5,27.4-35.9c11.1-16,19.7-33.6,24.8-52c5.4-19.5,7.3-39.6,7-59.8c-0.2-11.7-1.4-23.3-3.6-34.8c-4.4-23-14.6-44.5-28.5-64c-13.8-19.4-31-36.8-49.8-51.4c-11.7-9.1-24.3-17.2-37.4-24.1c-15.7-8.3-32.3-15.1-49-21.6c-11.2-4.4-22.5-8.5-33.3-13.6c-13.7-6.5-26.8-14.7-41.2-19.5c-15.7-5.2-32.7-7-49.2-8.1c-22.7-1.5-45.5-1-68.3-0.8c-15.7,0.1-31.4,0.1-47.1-0.8c-12.7-0.7-25.4-2.8-38.1-4.2c-15.7-1.7-31.5-3-47.2-3.1C550.5,134.1,443.3,134.1,336.1,139.7z"
                                            />
                                        </svg>

                                        <div className="absolute inset-0">
                                            {unitsWithMissions.map(unit => (
                                                <div
                                                    key={unit.id}
                                                    className="absolute transition-all duration-500 transform -translate-x-1/2 -translate-y-1/2 group"
                                                    style={{ left: unit.coords.x, top: unit.coords.y }}
                                                    onMouseEnter={() => setActiveUnit(unit.id)}
                                                    onMouseLeave={() => setActiveUnit(null)}
                                                >
                                                    {/* PULSE ANIMATION FOR MISSIONS */}
                                                    {unit.activeMissions > 0 && (
                                                        <>
                                                            <div className="absolute -inset-16 bg-amber-500 rounded-full opacity-10 animate-ping" style={{ animationDuration: '4s' }} />
                                                            <div className="absolute -inset-8 bg-amber-400 rounded-full opacity-20 animate-pulse" />
                                                        </>
                                                    )}

                                                    <div className="relative cursor-pointer transition-all duration-500 group-hover:scale-150 z-20">
                                                        {/* GLOW EFFECT */}
                                                        <div className="absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: unit.color }} />

                                                        {/* MARKER SHAPE */}
                                                        <div className="w-6 h-6 rounded-2xl border-2 border-white/50 shadow-2xl flex items-center justify-center overflow-hidden transition-all relative z-10 backdrop-blur-sm"
                                                            style={{ backgroundColor: `${unit.color}CC` }}>
                                                            <span className="text-[12px] filter brightness-0 invert opacity-90">{unit.icon}</span>
                                                        </div>

                                                        {/* LABEL SUTIL ABAIXO */}
                                                        <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 pointer-events-none`}>
                                                            <span className={`text-[9px] font-black whitespace-nowrap px-2 py-1 rounded-lg shadow-xl ${theme === 'dark' ? 'bg-slate-900 border border-slate-700 text-slate-300' : 'bg-white border border-slate-200 text-slate-600'}`}>
                                                                {unit.fullName}
                                                            </span>
                                                        </div>

                                                        {/* TOOLTIP DETALHADO (PREMIUM) */}
                                                        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-6 w-64 pointer-events-none transition-all duration-500 z-50 transform ${activeUnit === unit.id ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90'}`}>
                                                            <div className={`rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border backdrop-blur-2xl ${theme === 'dark' ? 'bg-slate-950/90 border-slate-800' : 'bg-white/95 border-slate-200 shadow-2xl shadow-slate-200/50'}`}>
                                                                <div className="flex items-center gap-4 mb-4">
                                                                    <div className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-3xl shadow-2xl relative overflow-hidden group-hover:rotate-12 transition-transform" style={{ backgroundColor: `${unit.color}20` }}>
                                                                        <div className="absolute inset-0 opacity-20" style={{ backgroundColor: unit.color }} />
                                                                        <span className="relative z-10">{unit.icon}</span>
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h4 className={`font-black text-sm leading-tight mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{unit.fullName}</h4>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <MapPin size={10} className="text-amber-500" />
                                                                            <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{unit.city} — {unit.state}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                                    <div className={`p-3 rounded-2xl border transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md'}`}>
                                                                        <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>Capacidade</p>
                                                                        <p className={`text-base font-black ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{unit.beds} <span className="text-[10px] font-bold text-slate-500">leitos</span></p>
                                                                    </div>
                                                                    <div className={`p-3 rounded-2xl border transition-colors ${theme === 'dark' ? 'bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10' : 'bg-amber-50 border-amber-100 hover:bg-white hover:shadow-md'}`}>
                                                                        <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-amber-500' : 'text-amber-600'}`}>Missões</p>
                                                                        <p className="text-base font-black text-amber-500">{unit.activeMissions} <span className="text-[10px] font-bold text-amber-500/60">ativas</span></p>
                                                                    </div>
                                                                </div>

                                                                {unit.activeMissions > 0 ? (
                                                                    <div className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase text-center flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02] ${theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/10' : 'bg-emerald-500 text-white border border-emerald-600 shadow-emerald-200'}`}>
                                                                        <Activity size={12} className="animate-spin" /> Unidade em Operação
                                                                    </div>
                                                                ) : (
                                                                    <div className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase text-center flex items-center justify-center gap-2 border ${theme === 'dark' ? 'bg-slate-900 text-slate-500 border-slate-800' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                                                        Monitoramento Nominal
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* PREMIUM ARROW */}
                                                            <div className={`w-4 h-4 rotate-45 absolute -bottom-2 left-1/2 -translate-x-1/2 border-r border-b backdrop-blur-xl ${theme === 'dark' ? 'bg-slate-950/90 border-slate-800' : 'bg-white/95 border-slate-200 shadow-2xl shadow-slate-200/50'}`} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* FOOTER DO MAPA COM CONTROLES */}
                                    <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Sede Hospitalar</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Navio de Assistência</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Zonas de Missão</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}>
                                                Exportar GeoData
                                            </button>
                                            <button className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl ${theme === 'dark' ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-950 hover:bg-black text-white shadow-slate-200'}`}>
                                                Relatório Completo
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* MARCA D'ÁGUA DISCRETA NO FUNDO DO CARD */}
                                <img src="/logo alsf.webp" alt="" className="absolute -bottom-20 -right-20 h-80 opacity-[0.03] grayscale pointer-events-none" />
                            </div>
                        </div>
                    )}

                    {activeView === 'clinical' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* CLINICAL KPI ROW */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className={`p-6 rounded-3xl border transition-all ${theme === 'dark' ? 'bg-slate-900/60 border-slate-800 shadow-2xl hover:border-blue-500/30' : 'bg-white border-slate-200 shadow-lg hover:border-blue-500'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                            <Activity size={24} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black tracking-tight">854</p>
                                            <p className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Triagens/Hoje</p>
                                        </div>
                                    </div>
                                    <div className="h-1 bg-slate-100/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[75%]" />
                                    </div>
                                </div>
                                <div className={`p-6 rounded-3xl border transition-all ${theme === 'dark' ? 'bg-slate-900/60 border-slate-800 shadow-2xl hover:border-emerald-500/30' : 'bg-white border-slate-200 shadow-lg hover:border-emerald-500'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                            <Building2 size={24} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black tracking-tight">42</p>
                                            <p className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Leitos Livres</p>
                                        </div>
                                    </div>
                                    <div className="h-1 bg-slate-100/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[15%]" />
                                    </div>
                                </div>
                                <div className={`p-6 rounded-3xl border transition-all ${theme === 'dark' ? 'bg-slate-900/60 border-slate-800 shadow-2xl hover:border-violet-500/30' : 'bg-white border-slate-200 shadow-lg hover:border-violet-500'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
                                            <Star size={24} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black tracking-tight">1.2k</p>
                                            <p className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Cirurgias/Mês</p>
                                        </div>
                                    </div>
                                    <div className="h-1 bg-slate-100/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-violet-500 w-[92%]" />
                                    </div>
                                </div>
                                <div className={`p-6 rounded-3xl border transition-all ${theme === 'dark' ? 'bg-slate-900/60 border-slate-800 shadow-2xl hover:border-red-500/30' : 'bg-white border-slate-200 shadow-lg hover:border-red-500'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
                                            <AlertCircle size={24} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black tracking-tight">07</p>
                                            <p className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Críticos Alta</p>
                                        </div>
                                    </div>
                                    <div className="h-1 bg-slate-100/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 w-[30%]" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* UNIT CLINICAL STATUS */}
                                <div className={`lg:col-span-2 rounded-[2.5rem] p-8 border transition-all ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Capacidade por Unidade</h3>
                                            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Monitoramento de Leitos e Ocupação</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                {ALSF_UNITS.slice(0, 4).map((u, i) => (
                                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-black overflow-hidden shadow-xl" style={{ borderColor: theme === 'dark' ? '#0f172a' : '#fff' }}>
                                                        {u.icon}
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-black text-slate-500 ml-2">ATUALIZADO AGORA</span>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {ALSF_UNITS.map((unit) => {
                                            const occupancy = Math.floor(Math.random() * 40) + 60; // 60-100%
                                            const isCritical = occupancy > 90;
                                            return (
                                                <div key={unit.id} className="group cursor-pointer">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all group-hover:scale-110 shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                                                {unit.icon}
                                                            </div>
                                                            <div>
                                                                <p className={`text-xs font-black ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{unit.fullName}</p>
                                                                <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{unit.city} • {unit.beds} LEITOS</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-sm font-black ${isCritical ? 'text-red-500' : (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600')}`}>{occupancy}%</p>
                                                            <p className="text-[8px] font-black text-slate-500 uppercase">OCUPAÇÃO</p>
                                                        </div>
                                                    </div>
                                                    <div className={`h-1.5 rounded-full overflow-hidden p-[1px] ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 shadow-lg ${isCritical ? 'bg-red-500 shadow-red-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}
                                                            style={{ width: `${occupancy}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <button className={`w-full mt-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 border ${theme === 'dark' ? 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-500 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:shadow-xl'}`}>
                                        Download Relatório de Transferências
                                    </button>
                                </div>

                                {/* CRITICAL ALERTS PANEL (HSF MODEL INSPIRED) */}
                                <div className="space-y-6">
                                    <div className={`rounded-[2.5rem] p-6 border transition-all ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                                        <h3 className={`text-sm font-black mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                            Alertas Críticos (ALSF-24h)
                                        </h3>
                                        <div className="space-y-4">
                                            {[
                                                { title: 'Estoque O- Sangue', unit: 'HSFA-RJ', status: 'Crítico', desc: 'Reposição necessária em 4h.', color: 'red' },
                                                { title: 'Tomógrafo Offline', unit: 'HRSP-SP', status: 'Urgente', desc: 'Manutenção técnica em curso.', color: 'amber' },
                                                { title: 'Capacidade de Oxigênio', unit: 'BH Papa Francisco', status: 'Alerta', desc: 'Nível em 15%. Reabastecimento agendado.', color: 'red' },
                                                { title: 'Dengue: Surto Detectado', unit: 'HLID-SP', status: 'Atenção', desc: 'Protocolo de contenção ativado.', color: 'amber' }
                                            ].map((alert, i) => (
                                                <div key={i} className={`p-4 rounded-2xl border transition-all hover:translate-x-1 ${theme === 'dark' ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-lg'}`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <p className={`text-xs font-black ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{alert.title}</p>
                                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${alert.color === 'red' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'}`}>
                                                            {alert.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <Building2 size={10} className="text-slate-500" />
                                                        <p className={`text-[9px] font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>{alert.unit}</p>
                                                    </div>
                                                    <p className={`text-[10px] font-medium leading-tight ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{alert.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* CLOUD ANALYSIS BOX */}
                                    <div className="rounded-[2.5rem] p-8 bg-gradient-to-br from-indigo-600 to-violet-700 shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                                        <Zap className="w-8 h-8 text-indigo-200 mb-4 animate-pulse" />
                                        <h4 className="text-white text-lg font-black mb-2">IA Predict: Diagnósticos</h4>
                                        <p className="text-indigo-100 text-[10px] font-medium leading-relaxed mb-6 uppercase tracking-wider">Análise preditiva de demanda baseada no clima e sazonalidade regional.</p>
                                        <button className="w-full py-4 bg-white text-indigo-600 text-[10px] font-black rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 uppercase tracking-widest">
                                            Gerar Insights Preditivos
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeView === 'missions' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* MISSION KPI ROW */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard label="Operações em Curso" value={displayMissions.filter(m => m.status === 'planned').length} sub="Ativas agora" icon={<Ship size={18} />} color="from-cyan-600 to-cyan-400" theme={theme} />
                                <StatCard label="Técnicos em Campo" value="142" sub="Equipe multidisciplinar" icon={<Users size={18} />} color="from-amber-600 to-amber-400" theme={theme} />
                                <StatCard label="Cidades Cobertas" value="18" sub="Amazonas e Pará" icon={<MapPin size={18} />} color="from-emerald-600 to-emerald-400" theme={theme} />
                                <StatCard label="Consumo de Verba" value="74%" sub="Orc: R$ 450k" icon={<DollarSign size={18} />} color="from-rose-600 to-rose-400" theme={theme} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* ACTIVE MISSIONS LIST */}
                                <div className={`lg:col-span-2 space-y-6`}>
                                    <div className="flex items-center justify-between mb-2 px-2">
                                        <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Desdobramento de Missões</h3>
                                        <button className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:underline">Ver Histórico Completo</button>
                                    </div>

                                    {displayMissions.map((mission, i) => (
                                        <div key={mission.id} className={`rounded-[2.5rem] p-8 border transition-all hover:scale-[1.01] ${theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                                            <div className="flex flex-col md:flex-row gap-6">
                                                <div className="md:w-1/3 flex flex-col gap-4">
                                                    <div className={`p-6 rounded-[2rem] aspect-square flex flex-col items-center justify-center text-center relative overflow-hidden ${theme === 'dark' ? 'bg-slate-950 border border-slate-800' : 'bg-slate-50 border border-slate-100'}`}>
                                                        <div className="absolute top-0 right-0 p-4">
                                                            <div className={`w-3 h-3 rounded-full ${mission.status === 'planned' ? 'bg-cyan-500 animate-pulse' : 'bg-emerald-500'}`} />
                                                        </div>
                                                        <Ship className={`w-12 h-12 mb-4 ${mission.status === 'planned' ? 'text-cyan-400' : 'text-emerald-400'}`} />
                                                        <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Status Operacional</p>
                                                        <p className={`text-sm font-black mt-1 ${mission.status === 'planned' ? 'text-cyan-500' : 'text-emerald-500'}`}>{mission.status === 'planned' ? 'EM DESLOCAMENTO' : 'CONCLUÍDA'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex-1 space-y-4">
                                                    <div>
                                                        <h4 className={`text-2xl font-black leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{mission.title}</h4>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Calendar size={14} className="text-amber-500" />
                                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{mission.date}</span>
                                                        </div>
                                                    </div>
                                                    <p className={`text-sm font-medium leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{mission.description}</p>

                                                    <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-800/10">
                                                        <div className="text-center">
                                                            <p className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{mission.volunteerIds?.length || 0}</p>
                                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Voluntários</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{mission.beneficiaryIds?.length || 0}</p>
                                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Atendidos</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className={`text-lg font-black ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>R$ {(mission.financial?.budget / 1000).toFixed(0)}k</p>
                                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Aporte</p>
                                                        </div>
                                                    </div>

                                                    {/* Mostrar recursos alocados para o Presidente */}
                                                    {mission.allocatedItems && mission.allocatedItems.length > 0 && (
                                                        <div className="py-2">
                                                            <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                                                                <Package size={10} className="inline mr-1" />
                                                                Recursos Logísticos Alocados
                                                            </p>
                                                            <div className="space-y-2">
                                                                {mission.allocatedItems.map((allocItem, aidx) => {
                                                                    const itemData = items?.find(i => i.id === allocItem.itemId);
                                                                    return (
                                                                        <div key={aidx} className={`flex justify-between items-center p-3 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                                                                            <div>
                                                                                <p className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{itemData ? itemData.name : 'Recurso desconhecido'}</p>
                                                                                {itemData && <p className={`text-[9px] uppercase tracking-widest mt-0.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>{itemData.category}</p>}
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <p className={`text-xs font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{allocItem.quantity}</p>
                                                                                {itemData && <p className={`text-[9px] uppercase tracking-widest mt-0.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>{itemData.unit}</p>}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {evaluatingMissionId === mission.id ? (
                                                        <div className={`pt-4 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'} space-y-4`}>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h5 className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Análise Preliminar e Aporte</h5>
                                                            </div>
                                                            <div>
                                                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Aporte Financeiro (R$)</label>
                                                                <div className="relative">
                                                                    <DollarSign className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
                                                                    <input type="number" value={evalBudget} onChange={e => setEvalBudget(e.target.value)} className={`w-full pl-10 pr-4 py-3 rounded-xl border ${theme === 'dark' ? 'bg-slate-950/50 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} focus:outline-none focus:border-amber-500 font-medium transition-colors`} />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Observações (Parecer Técnico)</label>
                                                                <textarea value={evalObservation} onChange={e => setEvalObservation(e.target.value)} rows={3} className={`w-full p-4 rounded-xl border resize-none ${theme === 'dark' ? 'bg-slate-950/50 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} focus:outline-none focus:border-amber-500 font-medium transition-colors`} placeholder="Descreva aqui os motivos de aprovação, ressalvas ou razões de cancelamento..."></textarea>
                                                            </div>
                                                            <div className="flex items-center gap-3 pt-2">
                                                                <button onClick={() => setEvaluatingMissionId(null)} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>Cancelar</button>
                                                                <button onClick={() => handleApproveMission(mission.id, 'rejected')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 border ${theme === 'dark' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'}`}>Desaprovar</button>
                                                                <button onClick={() => handleApproveMission(mission.id, 'approved')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 ${theme === 'dark' ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'}`}>Aprovar Missão e Orçamento</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-3 pt-2">
                                                            {mission.approvalStatus && (
                                                                <div className={`p-4 rounded-2xl border flex items-center justify-between ${theme === 'dark' ? (mission.approvalStatus === 'approved' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20') : (mission.approvalStatus === 'approved' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100')}`}>
                                                                    <div>
                                                                        <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Parecer Presidencial</p>
                                                                        <p className={`text-sm font-black flex items-center gap-2 mt-1 ${mission.approvalStatus === 'approved' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                            {mission.approvalStatus === 'approved' && <CheckCircle2 size={16} />}
                                                                            {mission.approvalStatus === 'rejected' && <XCircle size={16} />}
                                                                            {mission.approvalStatus === 'approved' ? 'MISSÃO APROVADA' : 'MISSÃO REJEITADA / CANCELADA'}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Aporte Ratificado</p>
                                                                        <p className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>R$ {((mission.financial?.budget || 0) / 1000).toFixed(0)}k</p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {mission.presidentObservation && !evaluatingMissionId && (
                                                                <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                                                    <span className="font-black text-[10px] uppercase tracking-widest text-slate-500 block mb-1.5 flex items-center gap-1.5"><FileText size={10} /> Observação do Presidente:</span>
                                                                    {mission.presidentObservation}
                                                                </div>
                                                            )}

                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={() => {
                                                                        setEvaluatingMissionId(mission.id);
                                                                        setEvalBudget((mission.financial?.budget || 0).toString());
                                                                        setEvalObservation(mission.presidentObservation || '');
                                                                    }}
                                                                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 border ${theme === 'dark' ? 'bg-slate-900 border-amber-500/20 text-amber-500 hover:bg-amber-500/10' : 'bg-white border-amber-500 text-amber-600 hover:bg-amber-50'}`}
                                                                >
                                                                    <ShieldCheck size={14} /> Avaliar / Editar Aporte
                                                                </button>
                                                                <button
                                                                    onClick={() => window.open('/mission-control', '_blank')}
                                                                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 ${theme === 'dark' ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
                                                                >
                                                                    Ver Telemetria
                                                                </button>
                                                                <button className={`p-4 rounded-2xl border transition-all hover:scale-105 active:scale-95 ${theme === 'dark' ? 'border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}><Share2 size={16} /></button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* SIDEBAR MISSION ANALYTICS */}
                                <div className="space-y-6">
                                    <div className={`rounded-[2.5rem] p-8 border transition-all ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                                        <h3 className={`text-sm font-black mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                                            Metas de Impacto Q1
                                        </h3>
                                        <div className="space-y-6">
                                            {[
                                                { label: 'Alcance Geográfico', current: 75, target: 100, color: 'bg-blue-500' },
                                                { label: 'Eficiência de Custos', current: 92, target: 100, color: 'bg-emerald-500' },
                                                { label: 'Captação de Voluntários', current: 45, target: 100, color: 'bg-amber-500' }
                                            ].map((goal, i) => (
                                                <div key={i}>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{goal.label}</p>
                                                        <p className={`text-xs font-black ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{goal.current}%</p>
                                                    </div>
                                                    <div className={`h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                                        <div className={`h-full ${goal.color} rounded-full transition-all duration-1000 shadow-lg shadow-blue-500/20`} style={{ width: `${goal.current}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={`rounded-[2.5rem] p-8 bg-gradient-to-br transition-all border ${theme === 'dark' ? 'from-cyan-900/20 to-slate-950 border-cyan-500/10' : 'from-cyan-50 to-white border-cyan-100 shadow-xl'}`}>
                                        <Ship className="w-8 h-8 text-cyan-500 mb-4" />
                                        <h4 className={`text-lg font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Barco Hospital Itinerante</h4>
                                        <p className={`text-[10px] font-medium leading-relaxed mb-6 uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Unidades Papa Francisco e João XXIII em sincronia operacional via satélite.</p>
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="flex -space-x-2">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[10px]">👨‍⚕️</div>
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-black text-emerald-500 tracking-tighter">EQUIPE ON-BOARD</span>
                                        </div>
                                        <button className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl ${theme === 'dark' ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : 'bg-cyan-600 text-white hover:bg-cyan-700'}`}>Mapa de Navegação Ativo</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeView === 'reports' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* REPORTS KPI ROW */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard label="Insights Gerados" value="1.2k" sub="Este mês (+15%)" icon={<Zap size={18} />} color="from-indigo-600 to-indigo-400" theme={theme} />
                                <StatCard label="Precisão de IA" value="98.4%" sub="Modelo Preditivo" icon={<Target size={18} />} color="from-purple-600 to-purple-400" theme={theme} />
                                <StatCard label="Uptime Data Lake" value="99.9%" sub="Sincronização Ativa" icon={<Activity size={18} />} color="from-blue-600 to-blue-400" theme={theme} />
                                <StatCard label="Economia Gerada" value="R$ 82k" sub="Gestão de Insumos" icon={<TrendingUp size={18} />} color="from-emerald-600 to-emerald-400" theme={theme} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* MAIN REPORTS SECTION */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="flex items-center justify-between mb-2 px-2">
                                        <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Biblioteca Executiva</h3>
                                        <div className="flex gap-2">
                                            <button className={`p-2 rounded-xl border transition-all ${theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}><Filter size={14} /></button>
                                            <button className={`p-2 rounded-xl border transition-all ${theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}><Search size={14} /></button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { title: 'Consolidado Financeiro Q1', date: 'Há 2 horas', size: '4.2 MB', category: 'Financeiro', color: 'text-emerald-500' },
                                            { title: 'Ocupação Hospitalar Nacional', date: 'Há 45 min', size: '1.8 MB', category: 'Clínico', color: 'text-blue-500' },
                                            { title: 'Performance de Voluntariado', date: 'Ontem', size: '3.1 MB', category: 'Operacional', color: 'text-amber-500' },
                                            { title: 'Auditoria de Processos PDF', date: 'Há 3 dias', size: '12.4 MB', category: 'Compliance', color: 'text-indigo-500' }
                                        ].map((report, i) => (
                                            <div key={i} className={`group rounded-[2rem] p-6 border transition-all cursor-pointer hover:border-amber-500/50 ${theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                                        <FileText size={20} className="text-amber-500" />
                                                    </div>
                                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity"><Download size={16} className="text-slate-500 hover:text-amber-500" /></button>
                                                </div>
                                                <h4 className={`font-black text-lg mb-1 leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{report.title}</h4>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[8px] font-black uppercase tracking-widest ${report.color}`}>{report.category}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                                    <span className="text-[10px] font-bold text-slate-500">{report.date}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* DATA VISUALIZATION PLACEHOLDER */}
                                    <div className={`rounded-[2.5rem] p-10 border relative overflow-hidden ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                                        <div className="relative z-10">
                                            <h3 className={`text-xl font-black mb-8 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Tendência de Atendimento 2024</h3>
                                            <div className="flex items-end gap-2 h-48 mb-6">
                                                {[45, 60, 40, 75, 55, 90, 65, 80, 50, 70, 85, 95].map((h, i) => (
                                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                                        <div
                                                            className={`w-full rounded-t-lg transition-all duration-1000 group-hover:bg-amber-500 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}
                                                            style={{ height: `${h}%` }}
                                                        />
                                                        <span className="text-[8px] font-black text-slate-500 uppercase">M{i + 1}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center pt-6 border-t border-slate-800/10">
                                                <div className="flex gap-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Projetado</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-slate-700" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Realizado</span>
                                                    </div>
                                                </div>
                                                <button className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-amber-500' : 'text-slate-900'}`}>Exportar Dataset</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* REPORT ACTIONS & UTILS */}
                                <div className="space-y-6">
                                    <div className={`rounded-[2.5rem] p-8 bg-gradient-to-br transition-all border ${theme === 'dark' ? 'from-purple-900/20 to-slate-950 border-purple-500/10' : 'from-purple-50 to-white border-purple-100 shadow-xl'}`}>
                                        <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                                            <Sparkles size={24} className="text-white" />
                                        </div>
                                        <h4 className={`text-xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>AI Smart Report</h4>
                                        <p className={`text-sm font-medium leading-relaxed mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Pergunte qualquer coisa sobre os dados da ALSF e nossa IA gerará um relatório instantâneo.</p>
                                        <div className={`relative mb-4 ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'} rounded-2xl overflow-hidden border border-purple-500/20 shadow-inner`}>
                                            <input
                                                type="text"
                                                placeholder="Qual o impacto social em 2023?"
                                                className="w-full bg-transparent p-4 text-xs font-bold outline-none placeholder:text-slate-600"
                                            />
                                            <button className="absolute right-2 top-2 p-2 bg-purple-500 rounded-xl text-white hover:scale-105 transition-transform"><ArrowRight size={14} /></button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {['Custos/Voo', 'Voluntários/Região'].map(tag => (
                                                <span key={tag} className="text-[8px] font-black px-3 py-1 bg-purple-500/10 text-purple-500 rounded-full border border-purple-500/10 cursor-pointer hover:bg-purple-500/20">{tag}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={`rounded-[2.5rem] p-8 border ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
                                        <h3 className={`text-sm font-black mb-6 uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Agendamentos</h3>
                                        <div className="space-y-4">
                                            {[
                                                { label: 'Fechamento Mensal', time: 'Todo dia 01', status: 'Ativo' },
                                                { label: 'Relatório Trimestral', time: 'Todo dia 15', status: 'Aguardando' }
                                            ].map((job, i) => (
                                                <div key={i} className={`flex items-center justify-between p-4 rounded-2xl ${theme === 'dark' ? 'bg-slate-950/50' : 'bg-slate-50'}`}>
                                                    <div>
                                                        <p className={`text-xs font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{job.label}</p>
                                                        <p className="text-[10px] font-bold text-slate-500">{job.time}</p>
                                                    </div>
                                                    <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">ON</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="w-full mt-6 py-4 rounded-2xl border-2 border-dashed border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:border-amber-500/50 hover:text-amber-500 transition-all">Novo Agendamento</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeView === 'compliance' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* COMPLIANCE KPI ROW */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard label="Score de Conformidade" value="94%" sub="Objetivo: 100%" icon={<ShieldCheck size={18} />} color="from-emerald-600 to-emerald-400" theme={theme} />
                                <StatCard label="Auditorias (Ano)" value="12" sub="3 pendentes" icon={<FileCheck size={18} />} color="from-blue-600 to-blue-400" theme={theme} />
                                <StatCard label="Incidentes Críticos" value="0" sub="Últimos 90 dias" icon={<ShieldAlert size={18} />} color="from-rose-600 to-rose-400" theme={theme} />
                                <StatCard label="Certificações" value="08" sub="Válidas até 2025" icon={<Award size={18} />} color="from-amber-600 to-amber-400" theme={theme} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* REGULATORY STATUS */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className={`rounded-[2.5rem] p-8 border ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                                        <h3 className={`text-xl font-black mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Monitoramento Regulatório</h3>
                                        <div className="space-y-4">
                                            {[
                                                { name: 'Lei Geral de Proteção de Dados (LGPD)', status: 'Conforme', progress: 100, color: 'text-emerald-500' },
                                                { name: 'Normas ONA (Acreditação Hospitalar)', status: 'Em Revisão', progress: 85, color: 'text-amber-500' },
                                                { name: 'ISO 9001:2015 - Gestão de Qualidade', status: 'Conforme', progress: 100, color: 'text-emerald-500' },
                                                { name: 'Normas Sanitárias (ANVISA)', status: 'Ações Necessárias', progress: 65, color: 'text-rose-500' }
                                            ].map((reg, i) => (
                                                <div key={i} className={`p-6 rounded-[2rem] border transition-all ${theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-100 hover:shadow-lg'}`}>
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div>
                                                            <h4 className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{reg.name}</h4>
                                                            <span className={`text-[10px] font-black uppercase tracking-widest ${reg.color}`}>{reg.status}</span>
                                                        </div>
                                                        <span className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{reg.progress}%</span>
                                                    </div>
                                                    <div className={`h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}>
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ${reg.progress === 100 ? 'bg-emerald-500' : reg.progress > 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                            style={{ width: `${reg.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* AUDIT LOG */}
                                    <div className={`rounded-[2.5rem] p-8 border ${theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Log de Auditoria</h3>
                                            <button className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:underline">Baixar Log Completo</button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-slate-800 uppercase text-[8px] font-black tracking-widest text-slate-500">
                                                        <th className="pb-4 text-left">Data/Hora</th>
                                                        <th className="pb-4 text-left">Usuário</th>
                                                        <th className="pb-4 text-left">Ação</th>
                                                        <th className="pb-4 text-right">Módulo</th>
                                                    </tr>
                                                </thead>
                                                <tbody className={`text-[10px] font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                                    {[
                                                        { date: '12/10/24 14:20', user: 'Admin.President', action: 'Exportação Financeira', module: 'Reports' },
                                                        { date: '12/10/24 11:05', user: 'Sist.Automação', action: 'Bkp de Dados Realizado', module: 'Security' },
                                                        { date: '11/10/24 09:15', user: 'Diretoria.Clin', action: 'Alteração de Escala', module: 'Clinical' },
                                                        { date: '11/10/24 08:00', user: 'Admin.President', action: 'Login no Sistema', module: 'Auth' }
                                                    ].map((log, i) => (
                                                        <tr key={i} className="border-b border-slate-800/50">
                                                            <td className="py-4">{log.date}</td>
                                                            <td className={`py-4 font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{log.user}</td>
                                                            <td className="py-4">{log.action}</td>
                                                            <td className="py-4 text-right">{log.module}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* SECURITY & CERTIFICATIONS */}
                                <div className="space-y-6">
                                    <div className={`rounded-[2.5rem] p-8 bg-gradient-to-br transition-all border ${theme === 'dark' ? 'from-rose-900/20 to-slate-950 border-rose-500/10' : 'from-rose-50 to-white border-rose-100 shadow-xl'}`}>
                                        <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center mb-6 shadow-lg shadow-rose-500/20">
                                            <ShieldAlert size={24} className="text-white" />
                                        </div>
                                        <h4 className={`text-xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Risk Assessment</h4>
                                        <p className={`text-sm font-medium leading-relaxed mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Detecção pró-ativa de vulnerabilidades operacionais e financeiras.</p>
                                        <div className="space-y-3 mb-6">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                <span className="text-slate-500">Exposição de Dados</span>
                                                <span className="text-emerald-500">Mínima</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                <span className="text-slate-500">Risco Orçamentário</span>
                                                <span className="text-amber-500">Moderado</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                <span className="text-slate-500">Dependência de Terceiros</span>
                                                <span className="text-rose-500">Elevado</span>
                                            </div>
                                        </div>
                                        <button className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl ${theme === 'dark' ? 'bg-rose-500 text-slate-950 hover:bg-rose-400' : 'bg-rose-600 text-white hover:bg-rose-700'}`}>Simular Cenários de Crise</button>
                                    </div>

                                    <div className={`rounded-[2.5rem] p-8 border ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
                                        <h3 className={`text-sm font-black mb-6 uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Certificações Válidas</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['LGPD Ready', 'ONA Nível 3', 'ISO 9001', 'ISO 27001', 'Selo Verde', 'ANVISA OK'].map(cert => (
                                                <div key={cert} className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                                                    <Award size={14} className="text-amber-500" />
                                                    <span className={`text-[8px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{cert}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="w-full mt-6 py-4 rounded-2xl text-[10px] font-black text-amber-500 border border-amber-500/20 hover:bg-amber-500/5 transition-all">Ver Repositório de Documentos</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* OVERLAY DE WATERMARK (SUTILÍSSIMO) */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay hidden lg:block">
                        <img src="/logo alsf.webp" alt="" className="h-[80%] absolute -right-20 -bottom-20 rotate-12" />
                    </div>

                    {/* MODERN FOOTER BAR (MOBILE ONLY) */}
                    <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 px-2 pb-6 pt-3 transition-all duration-500 ${theme === 'dark' ? 'bg-slate-950/90 border-t border-slate-900' : 'bg-white/90 border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]'
                        } backdrop-blur-xl`}>
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full max-w-full px-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                            {[
                                { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Início' },
                                { id: 'map', icon: <Globe size={20} />, label: 'Mapa' },
                                { id: 'missions', icon: <Target size={20} />, label: 'Missões' },
                                { id: 'clinical', icon: <Activity size={20} />, label: 'Rede' },
                                { id: 'reports', icon: <BarChart3 size={20} />, label: 'Relatórios' },
                                { id: 'compliance', icon: <Shield size={20} />, label: 'Auditoria' },
                                { id: 'logout', icon: <LogOut size={20} />, label: 'Sair', onClick: logout },
                            ].map((item: any, i) => (
                                <button
                                    key={i}
                                    onClick={item.onClick || (() => setActiveView(item.id))}
                                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl min-w-[72px] transition-all active:scale-95 shrink-0 ${activeView === item.id
                                        ? (theme === 'dark' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-200')
                                        : (theme === 'dark' ? 'text-slate-400 hover:text-slate-300 border border-transparent' : 'text-slate-500 hover:text-slate-700 border border-transparent')
                                        } ${item.id === 'logout' ? '!text-rose-500 hover:!text-rose-600' : ''}`}
                                >
                                    <div className={`p-1 rounded-xl transition-all`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-tight whitespace-nowrap">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
