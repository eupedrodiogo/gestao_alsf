import React, { useState, useMemo } from 'react';
import {
    Activity, UserCheck, Stethoscope, Pill, CheckCircle2,
    Search, UserPlus, Clock, ClipboardList, AlertCircle,
    ChevronRight, MapPin, Briefcase, Filter, ArrowRightLeft
} from 'lucide-react';
import { PatientVisit, Beneficiary, Volunteer, Mission, Item } from '../../types/index';
import { TriageModal } from './TriageModal';
import { ConsultationModal } from './ConsultationModal';

interface ClinicalModuleProps {
    activeSubTab: 'reception' | 'triage' | 'consultation';
    beneficiaries: Beneficiary[];
    patientVisits: PatientVisit[];
    volunteers: Volunteer[];
    missions: Mission[];
    items: Item[];
    currentUser: any;
    addPatientVisit: (visit: Omit<PatientVisit, 'id'>) => Promise<void>;
    updatePatientVisit: (id: string, data: Partial<PatientVisit>) => Promise<void>;
    openBeneficiaryModal: (beneficiary?: Beneficiary | null) => void;
    showToast: (title: string, type?: 'success' | 'error' | 'info' | 'warning', message?: string) => void;
}

export const ClinicalModule: React.FC<ClinicalModuleProps> = ({
    activeSubTab: externalActiveTab,
    beneficiaries,
    patientVisits,
    volunteers,
    missions,
    items,
    currentUser,
    addPatientVisit,
    updatePatientVisit,
    openBeneficiaryModal,
    showToast
}) => {
    const [internalTab, setInternalTab] = useState<'reception' | 'triage' | 'consultation'>(externalActiveTab);
    const [searchTerm, setSearchTerm] = useState('');
    const [isTriageModalOpen, setIsTriageModalOpen] = useState(false);
    const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState<PatientVisit | null>(null);

    const activeTab = internalTab;

    const today = new Date().toISOString().split('T')[0];
    const todaysVisits = useMemo(() =>
        (patientVisits || []).filter(v => v.date && v.date.startsWith(today)),
        [patientVisits, today]);

    const stats = {
        total: todaysVisits.length,
        triage: todaysVisits.filter(v => v.status === 'triage').length,
        waiting_consultation: todaysVisits.filter(v => v.status === 'waiting_consultation').length,
        in_consultation: todaysVisits.filter(v => v.status === 'in_consultation').length,
        pharmacy: todaysVisits.filter(v => v.status === 'pharmacy').length,
        completed: todaysVisits.filter(v => v.status === 'completed').length
    };

    const handleCheckIn = async (beneficiary: Beneficiary) => {
        const existing = todaysVisits.find(v => v.beneficiaryId === beneficiary.id);
        if (existing) {
            showToast('Atenção', 'warning', 'Beneficiário já fez check-in hoje!');
            return;
        }

        try {
            await addPatientVisit({
                beneficiaryId: beneficiary.id,
                beneficiaryName: beneficiary.name,
                date: new Date().toISOString(),
                status: 'triage',
                priority: 'normal',
                createdAt: { seconds: Math.floor(Date.now() / 1000) }
            } as any);
            showToast("Sincronizado", "success", `Check-in de ${beneficiary.name} realizado.`);
            setSearchTerm('');
        } catch (error) {
            showToast("Erro", "error", "Não foi possível realizar o check-in.");
        }
    };

    const handleSaveTriage = async (visitId: string, triageData: any) => {
        try {
            await updatePatientVisit(visitId, {
                triage: {
                    ...triageData,
                    nurseName: currentUser?.name || 'Enfermeiro(a)'
                },
                status: 'waiting_consultation'
            });
            showToast("Triagem Finalizada", "success", "Paciente encaminhado para a fila médica.");
        } catch (err) {
            showToast("Erro", "error", "Falha ao salvar triagem.");
        }
    };

    const handleSaveConsultation = async (visitId: string, consultationData: any) => {
        try {
            await updatePatientVisit(visitId, {
                doctor: {
                    ...consultationData,
                    doctorName: currentUser?.name || 'Médico(a)'
                },
                status: 'pharmacy'
            });
            showToast("Prontuário Salvo", "success", "Paciente encaminhado para dispensação farmacêutica.");
        } catch (err) {
            showToast("Erro", "error", "Falha ao salvar consulta.");
        }
    };

    // --- Intelligence Logic for Mission Stock ---
    const missionMedications = useMemo(() => {
        const myVol = volunteers.find(v => v.email?.toLowerCase() === currentUser?.email?.toLowerCase());
        const myMissions = missions.filter(m =>
            m.status !== 'cancelled' && myVol && (m.volunteerIds || []).includes(myVol.id)
        );
        const focusMissions = myMissions.length > 0
            ? myMissions
            : missions.filter(m => m.status === 'planned').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 1);

        const names: string[] = [];
        focusMissions.forEach(m => {
            (m.allocatedItems || []).forEach(alloc => {
                const item = items.find(i => i.id === alloc.itemId);
                if (item && item.category === 'Medicamentos' && !names.includes(item.name)) {
                    names.push(item.name);
                }
            });
        });
        return names;
    }, [missions, volunteers, items, currentUser]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Clinical Switcher */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex bg-white p-2 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50">
                    <TabButton active={activeTab === 'reception'} onClick={() => setInternalTab('reception')} icon={UserCheck} label="Recepção" color="blue" />
                    <TabButton active={activeTab === 'triage'} onClick={() => setInternalTab('triage')} icon={Activity} label="Triagem" color="amber" />
                    <TabButton active={activeTab === 'consultation'} onClick={() => setInternalTab('consultation')} icon={Stethoscope} label="Consultório" color="indigo" />
                </div>

                <div className="grid grid-cols-4 gap-2 w-full lg:w-auto">
                    <MiniStat label="Hoje" count={stats.total} />
                    <MiniStat label="Triagem" count={stats.triage} active color="amber" />
                    <MiniStat label="Médico" count={stats.waiting_consultation + stats.in_consultation} active color="blue" />
                    <MiniStat label="Concluído" count={stats.completed} active color="emerald" />
                </div>
            </div>

            {/* Sub-Module Contents */}
            {activeTab === 'reception' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-white p-2 rounded-[36px] border border-slate-200 shadow-sm flex items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome ou CPF..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-16 pr-8 py-5 bg-transparent border-none rounded-3xl text-lg font-bold text-slate-700 focus:ring-0 outline-none placeholder:text-slate-300"
                                />
                            </div>
                            <button
                                onClick={() => openBeneficiaryModal(null)}
                                className="p-4 bg-emerald-600 text-white rounded-[28px] mr-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                            >
                                <UserPlus className="w-6 h-6" />
                            </button>
                        </section>

                        <section className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden min-h-[500px]">
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Pessoas Encontradas</h3>
                                {searchTerm && <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{beneficiaries.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())).length} Resultados</span>}
                            </div>
                            <div className="divide-y divide-slate-50">
                                {searchTerm === '' ? (
                                    <div className="py-32 text-center opacity-40">
                                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search className="w-10 h-10 text-slate-300" />
                                        </div>
                                        <p className="font-bold text-slate-400">Inicie uma busca para realizar o check-in</p>
                                    </div>
                                ) : beneficiaries.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                                    <div className="py-24 text-center">
                                        <AlertCircle className="w-12 h-12 text-rose-200 mx-auto mb-4" />
                                        <p className="font-bold text-slate-400">Nenhum cadastro encontrado.</p>
                                        <button onClick={() => openBeneficiaryModal(null)} className="mt-4 text-blue-600 font-black text-xs uppercase tracking-widest hover:underline">Cadastrar Novo</button>
                                    </div>
                                ) : beneficiaries.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())).map(b => {
                                    const checkedIn = todaysVisits.some(v => v.beneficiaryId === b.id);
                                    return (
                                        <div key={b.id} className="p-6 flex items-center justify-between group hover:bg-blue-50/30 transition-all">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400 text-xl group-hover:bg-white group-hover:text-blue-500 transition-all">
                                                    {b.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-lg uppercase tracking-tight">{b.name}</p>
                                                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-1">DOC: {b.document || (b.cpf ? `CPF ${b.cpf}` : 'Sem Registro')}</p>
                                                </div>
                                            </div>
                                            {checkedIn ? (
                                                <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-emerald-100">
                                                    <CheckCircle2 className="w-4 h-4" /> Em Atendimento
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleCheckIn(b)}
                                                    className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 flex items-center gap-2"
                                                >
                                                    <ArrowRightLeft className="w-4 h-4" /> Check-in
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Fila em Tempo Real
                            </h3>
                            <div className="space-y-4">
                                {todaysVisits.length === 0 ? (
                                    <p className="text-slate-600 italic text-sm text-center py-10">Aguardando chegadas...</p>
                                ) : [...todaysVisits].reverse().slice(0, 10).map(v => (
                                    <div key={v.id} className="bg-slate-800/50 p-4 rounded-3xl border border-white/5 flex items-center justify-between">
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm uppercase tracking-tight truncate pr-2">{v.beneficiaryName}</p>
                                            <p className="text-[10px] text-slate-400 uppercase mt-1">{new Date(v.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <div className={`w-3 h-3 rounded-full shadow-[0_0_12px] ${v.status === 'triage' ? 'bg-amber-400 shadow-amber-500/50' :
                                            v.status === 'completed' ? 'bg-emerald-500 shadow-emerald-500/50' :
                                                'bg-blue-400 shadow-blue-500/50'
                                            }`} />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            )}

            {activeTab === 'triage' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <section className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
                            <div className="p-8 bg-amber-500 flex justify-between items-center text-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 rounded-2xl">
                                        <Activity className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tight">Fila de Triagem</h3>
                                        <p className="text-xs text-amber-100 font-medium">Chamadas em ordem de chegada</p>
                                    </div>
                                </div>
                                <span className="text-2xl font-black">{todaysVisits.filter(v => v.status === 'triage').length}</span>
                            </div>
                            <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
                                {todaysVisits.filter(v => v.status === 'triage').length === 0 ? (
                                    <div className="py-32 text-center text-slate-400">
                                        <p className="font-bold uppercase tracking-widest text-xs mb-2">Fila Vazia</p>
                                        <p className="text-sm italic">Todos os pacientes triados.</p>
                                    </div>
                                ) : todaysVisits.filter(v => v.status === 'triage').map((v, idx) => (
                                    <div key={v.id} className={`p-8 group hover:bg-amber-50/30 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${idx === 0 ? 'bg-amber-50/50 shadow-inner' : ''}`}>
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center font-black text-amber-600 text-2xl shadow-sm border border-amber-100">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 text-xl uppercase tracking-tighter">{v.beneficiaryName}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                                    <Clock className="w-3 h-3" /> {new Date(v.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setSelectedVisit(v); setIsTriageModalOpen(true); }}
                                            className={`px-8 py-4 rounded-[28px] font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95
                                                ${idx === 0 ? 'bg-amber-500 text-white shadow-amber-200 hover:bg-amber-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 shadow-slate-100'}`}
                                        >
                                            Iniciar Triagem
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="bg-white rounded-[40px] border border-slate-100 shadow-xl p-8">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
                                <Stethoscope className="w-4 h-4" /> Aguardando Médico
                            </h3>
                            <div className="space-y-4">
                                {todaysVisits.filter(v => v.status === 'waiting_consultation').length === 0 ? (
                                    <p className="text-center py-20 text-slate-300 italic">Vazio</p>
                                ) : todaysVisits.filter(v => v.status === 'waiting_consultation').map(v => (
                                    <div key={v.id} className="p-5 border border-slate-100 rounded-[32px] flex items-center justify-between group hover:border-blue-200 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center font-black text-blue-600 uppercase text-xs">
                                                {v.beneficiaryName.charAt(0)}
                                            </div>
                                            <p className="font-bold text-slate-700 uppercase text-sm tracking-tight">{v.beneficiaryName}</p>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Triagem OK</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            )}

            {activeTab === 'consultation' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
                            <div className="p-8 bg-blue-600 flex justify-between items-center text-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 rounded-2xl">
                                        <Stethoscope className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tight">Fila Médica</h3>
                                        <p className="text-xs text-blue-100 font-medium">Pacientes com triagem concluída</p>
                                    </div>
                                </div>
                                <span className="text-2xl font-black">{todaysVisits.filter(v => v.status === 'waiting_consultation').length}</span>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {todaysVisits.filter(v => v.status === 'waiting_consultation').length === 0 ? (
                                    <div className="py-40 text-center opacity-30">
                                        <Stethoscope className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                        <p className="font-bold">Aguardando próximos pacientes triados</p>
                                    </div>
                                ) : todaysVisits.filter(v => v.status === 'waiting_consultation').map((v, idx) => (
                                    <div key={v.id} className={`p-8 hover:bg-blue-50/30 transition-all flex justify-between items-center ${idx === 0 ? 'bg-blue-50/50 shadow-inner' : ''}`}>
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-white rounded-3xl flex flex-col items-center justify-center shadow-sm border border-blue-100">
                                                <span className="text-2xl font-black text-blue-600">{idx + 1}º</span>
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 text-2xl uppercase tracking-tighter">{v.beneficiaryName}</p>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-amber-500" /> Triagem completa
                                                    </span>
                                                    <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded uppercase">Urgência: {v.priority || 'Normal'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setSelectedVisit(v); setIsConsultationModalOpen(true); }}
                                            className="px-10 py-5 bg-blue-600 text-white rounded-[32px] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 flex items-center gap-3"
                                        >
                                            <ArrowRightLeft className="w-5 h-5" /> Atender
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 opacity-60">Meu Posto de Saúde</h3>
                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center text-2xl font-black">🏥</div>
                                    <div>
                                        <p className="text-xl font-black uppercase tracking-tight">{currentUser?.name || 'Médico de Plantão'}</p>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Responsável Clínico</p>
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-white/10 space-y-4">
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-3xl">
                                        <span className="text-xs font-bold text-slate-300">Sessões Restantes</span>
                                        <span className="text-xl font-black text-blue-400">{todaysVisits.filter(v => v.status === 'waiting_consultation').length}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-3xl">
                                        <span className="text-xs font-bold text-slate-300">Atendidos Hoje</span>
                                        <span className="text-xl font-black text-emerald-400 font-mono">{stats.completed + stats.pharmacy}</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            )}

            {/* Modals */}
            <TriageModal
                isOpen={isTriageModalOpen}
                onClose={() => setIsTriageModalOpen(false)}
                onSave={handleSaveTriage}
                visit={selectedVisit}
            />

            <ConsultationModal
                isOpen={isConsultationModalOpen}
                onClose={() => setIsConsultationModalOpen(false)}
                onSave={handleSaveConsultation}
                visit={selectedVisit}
                availableMedications={missionMedications}
            />
        </div>
    );
};

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    icon: any;
    label: string;
    color: 'blue' | 'amber' | 'indigo';
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon: Icon, label, color }) => {
    const colorClasses = {
        blue: active ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-50',
        amber: active ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-amber-500 hover:bg-slate-50',
        indigo: active ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-50'
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-8 py-4 rounded-[28px] text-xs font-black uppercase tracking-widest transition-all ${colorClasses[color]}`}
        >
            <Icon className="w-5 h-5 shadow-sm" />
            {label}
        </button>
    );
};

const MiniStat: React.FC<{ label: string, count: number, active?: boolean, color?: 'blue' | 'amber' | 'emerald' }> = ({ label, count, active, color = 'blue' }) => (
    <div className={`px-4 py-3 rounded-2xl border transition-all ${active
        ? color === 'blue' ? 'bg-blue-50 border-blue-100 text-blue-700' :
            color === 'amber' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                'bg-emerald-50 border-emerald-100 text-emerald-700'
        : 'bg-white border-slate-50 text-slate-400'
        }`}>
        <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-60">{label}</p>
        <p className="text-lg font-black tracking-tighter leading-none">{count}</p>
    </div>
);
