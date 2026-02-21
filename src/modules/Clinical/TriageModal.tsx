import React, { useState, useEffect } from 'react';
import { X, Stethoscope, Save, Activity, ClipboardList, Thermometer, Weight, LucideIcon } from 'lucide-react';
import { PatientVisit } from '../../types/index';

interface TriageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (visitId: string, triageData: any) => Promise<void>;
    visit: PatientVisit | null;
}

export const TriageModal: React.FC<TriageModalProps> = ({ isOpen, onClose, onSave, visit }) => {
    const [weight, setWeight] = useState('');
    const [bloodPressure, setBloodPressure] = useState('');
    const [temperature, setTemperature] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visit?.triage) {
            setWeight(visit.triage.weight || '');
            setBloodPressure(visit.triage.bloodPressure || '');
            setTemperature(visit.triage.temperature || '');
            setSymptoms(visit.triage.symptoms || '');
            setNotes(visit.triage.notes || '');
        } else {
            setWeight('');
            setBloodPressure('');
            setTemperature('');
            setSymptoms('');
            setNotes('');
        }
    }, [visit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!visit) return;
        setLoading(true);
        try {
            await onSave(visit.id, {
                weight,
                bloodPressure,
                temperature,
                symptoms,
                notes,
                date: new Date().toISOString()
            });
            onClose();
        } catch (error) {
            console.error("Error saving triage:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !visit) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-gradient-to-r from-amber-50 to-orange-50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-200">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-amber-900 tracking-tight">Realizar Triagem</h3>
                            <p className="text-sm text-amber-700 font-medium">Fluxo Vital e Sintomatologia</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-all">
                        <X className="w-6 h-6 text-amber-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-6 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Acolhido em Atendimento</p>
                            <p className="font-black text-slate-800 text-xl uppercase tracking-tighter">{visit.beneficiaryName}</p>
                        </div>
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                            <ClipboardList className="w-6 h-6 text-slate-300" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <TriageInput label="Peso (kg)" value={weight} onChange={setWeight} icon={Weight} placeholder="00.0" />
                        <TriageInput label="Pressão Art." value={bloodPressure} onChange={setBloodPressure} icon={Activity} placeholder="120/80" />
                        <TriageInput label="Temp. (°C)" value={temperature} onChange={setTemperature} icon={Thermometer} placeholder="36.5" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Sintomas / Queixa Principal</label>
                        <textarea
                            rows={3}
                            value={symptoms}
                            onChange={e => setSymptoms(e.target.value)}
                            className="w-full p-4 bg-slate-50 border-none rounded-3xl focus:ring-2 focus:ring-amber-500 transition-all outline-none font-bold text-slate-700 resize-none"
                            placeholder="O que o paciente está sentindo?"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Observações Clínicas</label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full p-4 bg-slate-50 border-none rounded-3xl focus:ring-2 focus:ring-amber-500 transition-all outline-none font-bold text-slate-700 resize-none italic"
                            placeholder="Notas adicionais do triador..."
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                        >
                            Voltar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-4 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-600 transition-all shadow-xl shadow-amber-100 flex items-center justify-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? 'Processando...' : 'Finalizar Triagem'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TriageInput: React.FC<{ label: string, value: string, onChange: (v: string) => void, icon: LucideIcon, placeholder: string }> = ({ label, value, onChange, icon: Icon, placeholder }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
        <div className="relative">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full pl-9 pr-3 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 transition-all outline-none font-bold text-slate-700"
                placeholder={placeholder}
            />
        </div>
    </div>
);
