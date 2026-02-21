import React, { useState, useEffect } from 'react';
import {
    X, Stethoscope, Save, ClipboardList, Pill, FileText,
    User, AlertCircle, History, ChevronRight, CheckCircle2
} from 'lucide-react';
import { PatientVisit, Mission, Item } from '../../types/index';

interface ConsultationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (visitId: string, consultationData: any) => Promise<void>;
    visit: PatientVisit | null;
    availableMedications: string[];
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
    isOpen,
    onClose,
    onSave,
    visit,
    availableMedications
}) => {
    const [diagnosis, setDiagnosis] = useState('');
    const [prescription, setPrescription] = useState('');
    const [internalNotes, setInternalNotes] = useState('');
    const [selectedMedications, setSelectedMedications] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visit?.doctor) {
            setDiagnosis(visit.doctor.diagnosis || '');
            setPrescription(visit.doctor.prescription || '');
            setInternalNotes(visit.doctor.internalNotes || '');
            setSelectedMedications(visit.doctor.selectedMedications || []);
        } else {
            setDiagnosis('');
            setPrescription('');
            setInternalNotes('');
            setSelectedMedications([]);
        }
    }, [visit, isOpen]);

    const handleToggleMedication = (medName: string) => {
        setSelectedMedications(prev =>
            prev.includes(medName)
                ? prev.filter(m => m !== medName)
                : [...prev, medName]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!visit) return;
        setLoading(true);
        try {
            await onSave(visit.id, {
                diagnosis,
                prescription,
                internalNotes,
                selectedMedications,
                date: new Date().toISOString()
            });
            onClose();
        } catch (error) {
            console.error("Error saving consultation:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !visit) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4 lg:p-8">
            <div className="bg-[#fcfdff] rounded-[48px] w-full max-w-6xl h-full max-h-[900px] overflow-hidden shadow-[0_32px_128px_-15px_rgba(0,0,0,0.3)] flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-500">
                {/* Header Premium */}
                <div className="p-8 lg:p-10 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-600 rounded-[28px] flex items-center justify-center shadow-2xl shadow-blue-200">
                            <Stethoscope className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Prontuário de Atendimento</h3>
                            <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                Sessão Clínica em curso
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-slate-50 rounded-[24px] transition-all group">
                        <X className="w-8 h-8 text-slate-300 group-hover:text-slate-600" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Left Sidebar: Patient Intelligence */}
                    <div className="w-full lg:w-80 bg-slate-50/50 border-r border-slate-100 p-8 space-y-8 overflow-y-auto">
                        <section>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 block">Paciente</label>
                            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center font-black text-blue-600 text-xl mb-4">
                                    {visit.beneficiaryName.charAt(0).toUpperCase()}
                                </div>
                                <h4 className="font-black text-slate-800 text-lg uppercase leading-tight">{visit.beneficiaryName}</h4>
                                <p className="text-xs font-bold text-slate-400 mt-2 font-mono">ID: {visit.beneficiaryId.substring(0, 8)}</p>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block font-bold">Resumo da Triagem</label>
                            <div className="grid grid-cols-2 gap-3">
                                <TriageStat label="Pressão" value={visit.triage?.bloodPressure} />
                                <TriageStat label="Temp." value={visit.triage?.temperature} suffix="°C" />
                                <TriageStat label="Peso" value={visit.triage?.weight} suffix="kg" />
                            </div>
                            <div className="bg-amber-50 p-5 rounded-[28px] border border-amber-100/50">
                                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Queixa Principal
                                </p>
                                <p className="text-sm font-bold text-amber-900 leading-relaxed italic">
                                    "{visit.triage?.symptoms || 'Não relatado'}"
                                </p>
                            </div>
                        </section>

                        <button className="w-full py-4 bg-white border border-slate-200 rounded-[24px] text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                            <History className="w-4 h-4" /> Histórico Completo
                        </button>
                    </div>

                    {/* Main Workspace: Clinical Record */}
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-8 lg:p-12 space-y-8 overflow-y-auto bg-white">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Evolução e Diagnóstico</label>
                                <div className="relative group">
                                    <FileText className="absolute left-6 top-6 w-6 h-6 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                    <textarea
                                        required
                                        rows={5}
                                        value={diagnosis}
                                        onChange={e => setDiagnosis(e.target.value)}
                                        className="w-full pl-16 pr-8 py-6 bg-slate-50 border-none rounded-[36px] focus:ring-4 focus:ring-blue-100 transition-all outline-none text-lg font-bold text-slate-700 placeholder:text-slate-300 leading-relaxed shadow-inner"
                                        placeholder="Descreva a anamnese, exame físico e conclusão..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Prescrição Farmacológica</label>
                                <div className="relative group">
                                    <Pill className="absolute left-6 top-6 w-6 h-6 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                    <textarea
                                        required
                                        rows={6}
                                        value={prescription}
                                        onChange={e => setPrescription(e.target.value)}
                                        className="w-full pl-16 pr-8 py-6 bg-slate-900 border-none rounded-[36px] focus:ring-4 focus:ring-blue-500 transition-all outline-none text-base font-mono font-bold text-emerald-400 placeholder:text-slate-700 leading-relaxed shadow-2xl"
                                        placeholder="1. Medicamento X --- 1 cp via oral de 12/12h..."
                                    />
                                </div>
                            </div>

                            {/* Medications Auto-Selector */}
                            {availableMedications.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                                            <ClipboardList className="w-4 h-4" /> Itens de Dispensação (Farmácia da Missão)
                                        </label>
                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter">
                                            {selectedMedications.length} Selecionado(s)
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {availableMedications.map(med => {
                                            const isSelected = selectedMedications.includes(med);
                                            return (
                                                <button
                                                    key={med}
                                                    type="button"
                                                    onClick={() => handleToggleMedication(med)}
                                                    className={`px-4 py-2.5 rounded-[18px] text-xs font-black uppercase tracking-widest transition-all border flex items-center gap-2
                                                        ${isSelected
                                                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                                                            : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-500'}`}
                                                >
                                                    {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                                    {med}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3 pt-4">
                                <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block">Notas de Enfermagem / Apoio</label>
                                <input
                                    value={internalNotes}
                                    onChange={e => setInternalNotes(e.target.value)}
                                    placeholder="Observação rápida para a farmácia ou triagem..."
                                    className="w-full px-8 py-4 bg-slate-50 border border-slate-100 rounded-[24px] focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-slate-500 italic"
                                />
                            </div>
                        </div>

                        <div className="flex gap-6 pt-10">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-10 py-5 bg-slate-100 text-slate-500 rounded-[28px] font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all active:scale-95"
                            >
                                Suspender
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-10 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-[28px] font-black uppercase tracking-widest text-sm hover:shadow-2xl hover:shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                <Save className="w-6 h-6" />
                                {loading ? 'Sincronizando...' : 'Concluir Atendimento e Liberar Prontuário'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const TriageStat: React.FC<{ label: string, value?: string, suffix?: string }> = ({ label, value, suffix = '' }) => (
    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm font-black text-slate-800">{value || '---'}{value && suffix}</p>
    </div>
);
