import React, { useState } from 'react';
import { Pill, Briefcase, Search, Plus, Minus, Trash2, CheckCircle, Clock, X } from 'lucide-react';
import { Item, Mission, PatientVisit, Volunteer } from '../../types';

interface PharmacyModuleProps {
    items: Item[];
    missions: Mission[];
    volunteers: Volunteer[];
    patientVisits: PatientVisit[];
    currentUserName: string;
    currentUserEmail: string;
    updateItem: (itemId: string, data: Partial<Item>) => Promise<void>;
    updatePatientVisit: (visitId: string, data: Partial<PatientVisit>) => Promise<void>;
    showToast: (title: string, type?: 'success' | 'error' | 'info', message?: string) => void;
}

export const PharmacyModule = ({
    items,
    missions,
    volunteers,
    patientVisits,
    currentUserName,
    currentUserEmail,
    updateItem,
    updatePatientVisit,
    showToast
}: PharmacyModuleProps) => {

    const [isPharmacyModalOpen, setIsPharmacyModalOpen] = useState(false);
    const [editingVisit, setEditingVisit] = useState<PatientVisit | null>(null);
    const [pharmacyForm, setPharmacyForm] = useState<{ dispensedItems: { itemId: string; name: string; quantity: number }[], notes: string }>({ dispensedItems: [], notes: '' });

    const today = new Date().toISOString().split('T')[0];
    const queue = (patientVisits || []).filter(v => v.date && v.date.startsWith(today) && v.status === 'pharmacy');
    const completed = (patientVisits || []).filter(v => v.date && v.date.startsWith(today) && v.status === 'completed');

    const handleStartPharmacy = (visit: PatientVisit) => {
        setEditingVisit(visit);
        setPharmacyForm({ dispensedItems: [], notes: '' });
        setIsPharmacyModalOpen(true);
    };

    const handleSavePharmacy = async () => {
        if (!editingVisit || !pharmacyForm) return;

        try {
            // 1. Update Inventory (decrement stock)
            for (const dispensed of pharmacyForm.dispensedItems) {
                const originalItem = items?.find(i => i.id === dispensed.itemId);
                if (originalItem) {
                    await updateItem(originalItem.id, {
                        quantity: originalItem.quantity - dispensed.quantity
                    });
                }
            }

            // 2. Update Visit
            await updatePatientVisit(editingVisit.id, {
                pharmacy: {
                    ...pharmacyForm,
                    pharmacistName: currentUserName || 'Farmacêutico',
                },
                status: 'completed',
            });

            setIsPharmacyModalOpen(false);
            setEditingVisit(null);
            setPharmacyForm({ dispensedItems: [], notes: '' });
            showToast('Sucesso', 'success', 'Dispensação realizada e estoque atualizado!');
        } catch (error) {
            console.error("Error saving pharmacy:", error);
            showToast("Erro ao finalizar farmácia", "error");
        }
    };

    // --- Mission Stock Panel Logic ---
    const allVolunteers = volunteers || [];
    const allMissions = missions || [];
    const allItems = items || [];

    const myVolunteer = allVolunteers.find(
        v => v.email?.toLowerCase() === currentUserEmail?.toLowerCase() ||
            v.name?.toLowerCase() === currentUserEmail?.toLowerCase().split('@')[0]
    );

    const myMissions = allMissions.filter(m =>
        m.status !== 'cancelled' &&
        myVolunteer && (m.volunteerIds || []).includes(myVolunteer.id)
    );

    const upcomingMissions = myMissions.length > 0
        ? myMissions
        : allMissions.filter(m => m.status === 'planned').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 1);

    type MissionMedItem = { itemName: string; unit: string; quantity: number; missionTitle: string; missionDate: string; stockQuantity: number };
    const missionMedItems: MissionMedItem[] = [];
    upcomingMissions.forEach(mission => {
        (mission.allocatedItems || []).forEach(alloc => {
            const item = allItems.find(i => i.id === alloc.itemId);
            if (item && item.category === 'Medicamentos') {
                missionMedItems.push({
                    itemName: item.name,
                    unit: item.unit,
                    quantity: alloc.quantity,
                    missionTitle: mission.title,
                    missionDate: mission.date,
                    stockQuantity: item.quantity,
                });
            }
        });
    });

    const addDispensedItem = (item: Item, quantity: number = 1) => {
        setPharmacyForm(prev => {
            const existing = prev.dispensedItems.find(i => i.itemId === item.id);
            if (existing) {
                return {
                    ...prev,
                    dispensedItems: prev.dispensedItems.map(i => i.itemId === item.id ? { ...i, quantity: i.quantity + quantity } : i)
                };
            }
            return {
                ...prev,
                dispensedItems: [...prev.dispensedItems, { itemId: item.id, name: item.name, quantity }]
            };
        });
    };

    const removeDispensedItem = (itemId: string) => {
        setPharmacyForm(prev => ({
            ...prev,
            dispensedItems: prev.dispensedItems.filter(i => i.itemId !== itemId)
        }));
    };


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Pill className="w-6 h-6 text-emerald-600" />
                        Farmácia
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Dispense medicamentos conforme prescrição médica</p>
                </div>
                <div className="flex gap-3">
                    {queue.length > 0 && (
                        <button
                            onClick={() => handleStartPharmacy(queue[0])}
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-bold rounded-xl hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 animate-pulse"
                        >
                            <Pill className="w-4 h-4" />
                            Chamar Próximo Paciente
                        </button>
                    )}
                </div>
            </div>

            {/* === MISSION STOCK PANEL === */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-teal-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                            <Pill className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-teal-900 text-sm">Farmácia da Missão</h3>
                            <p className="text-[11px] text-teal-600">
                                {upcomingMissions.length > 0
                                    ? `Medicamentos disponíveis para dispensação${myMissions.length === 0 ? ' (próxima missão planejada)' : ''}`
                                    : 'Nenhuma missão ativa encontrada'}
                            </p>
                        </div>
                    </div>
                    {upcomingMissions.length > 0 && (
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-1 rounded-full flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                {upcomingMissions[0]?.title}
                            </span>
                            <p className="text-[10px] text-teal-500 mt-0.5">
                                {upcomingMissions[0] && new Date(upcomingMissions[0].date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    )}
                </div>

                {missionMedItems.length === 0 ? (
                    <div className="p-8 text-center text-teal-400">
                        <Pill className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">Nenhum medicamento alocado à missão.</p>
                        <p className="text-xs opacity-70 mt-1">O farmacêutico pode solicitar itens no estoque central.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-4">
                        {missionMedItems.sort((a, b) => a.itemName.localeCompare(b.itemName)).map((med, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-3 border border-teal-100/50 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-50 to-transparent -mr-8 -mt-8 rounded-full z-0"></div>
                                <div className="relative z-10 flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-teal-900 text-[13px] leading-tight flex-1" title={med.itemName}>{med.itemName}</h4>
                                    <div className="bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase ml-2 flex-shrink-0">
                                        {med.unit}
                                    </div>
                                </div>
                                <div className="relative z-10 mt-2 flex justify-between items-end border-t border-slate-50 pt-2">
                                    <div className="text-[10px] text-slate-400 font-medium">Missão: <span className="text-teal-600 font-bold">{med.quantity} {med.unit}</span></div>
                                    <div className={`text-[10px] font-black px-1.5 py-0.5 rounded ${med.stockQuantity < 10 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                                        Est. {med.stockQuantity}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Main Action Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Filas */}
                <div className="bg-white border text-center border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col min-h-[400px]">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-500" />
                        Fila de Espera (Farmácia)
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs ml-auto">
                            {queue.length}
                        </span>
                    </h3>

                    {queue.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <CheckCircle className="w-16 h-16 opacity-20 mb-4" />
                            <p className="font-medium text-slate-600">Nenhum paciente aguardando.</p>
                            <p className="text-sm mt-1">Fila da farmácia vazia</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {queue.map(visit => (
                                <div key={visit.id} className="py-4 flex justify-between items-center group animate-in slide-in-from-left duration-300">
                                    <div className="text-left">
                                        <p className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{visit.patientName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-100">
                                                Médico: {visit.consultation?.doctorId || 'N/A'}
                                            </span>
                                            {visit.consultation?.prescription && (
                                                <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 font-bold flex items-center gap-1">
                                                    <Pill className="w-3 h-3" /> C/ Prescrição
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleStartPharmacy(visit)}
                                        className="bg-slate-50 hover:bg-emerald-50 text-emerald-600 p-2.5 rounded-xl border border-slate-200 hover:border-emerald-200 transition-all font-bold text-sm hidden group-hover:flex items-center gap-2"
                                    >
                                        Chamar Paciente
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Histórico Finalizados Hoje */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col min-h-[400px]">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-slate-400" />
                        Dispensados Hoje
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-auto">
                            {completed.length}
                        </span>
                    </h3>

                    <div className="divide-y divide-slate-100 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {completed.map(visit => (
                            <div key={visit.id} className="py-4 animate-in fade-in duration-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-700">{visit.patientName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] uppercase font-black tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Atendido</span>
                                            <span className="text-xs text-slate-400">{visit.pharmacy?.pharmacistName}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setEditingVisit(visit);
                                            setPharmacyForm(visit.pharmacy || { dispensedItems: [], notes: '' });
                                            setIsPharmacyModalOpen(true);
                                        }}
                                        className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 uppercase transition-colors"
                                    >
                                        VER RECIBO
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- modals --- */}
            {isPharmacyModalOpen && editingVisit && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Pill className="w-6 h-6 text-emerald-200" />
                                    {editingVisit.status === 'completed' ? 'Recibo de Farmácia' : 'Dispensação de Medicamentos'}
                                </h3>
                                <p className="text-emerald-100 text-sm mt-1">Beneficiário: <strong className="text-white">{editingVisit.patientName}</strong></p>
                            </div>
                            <button onClick={() => setIsPharmacyModalOpen(false)} className="text-emerald-200 hover:text-white transition-colors bg-black/10 hover:bg-black/20 p-2 rounded-full backdrop-blur-sm">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Prescrição Visualizer */}
                        <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-start gap-3 shrink-0">
                            <div className="bg-amber-100 p-2 rounded-lg text-amber-600 shrink-0">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-xs font-bold uppercase text-amber-800 tracking-wider mb-1">Prescrição Médica</h4>
                                <div className="text-sm font-medium text-amber-900 whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto p-2 bg-white/50 rounded-xl border border-amber-200/50 empty:hidden">
                                    {editingVisit.consultation?.prescription || 'Nenhuma prescrição em texto encontrada.'}
                                </div>
                                {(editingVisit.consultation?.selectedMedications || []).length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {(editingVisit.consultation?.selectedMedications || []).map((medId, idx) => {
                                            const item = items?.find(i => i.id === medId);
                                            return item ? (
                                                <span key={idx} className="bg-white border border-amber-200 text-amber-800 text-[11px] font-bold px-2 py-1 rounded shadow-sm">
                                                    {item.name}
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-slate-50">

                            {editingVisit.status !== 'completed' && (
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative z-20">
                                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Search className="w-4 h-4 text-emerald-500" /> Pesquisar Estoque Medicamentos
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                                        {(items || [])
                                            .filter(i => i.category === 'Medicamentos' && i.quantity > 0)
                                            .map(item => {
                                                const isInMission = missionMedItems.some(m => m.itemName === item.name);
                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => addDispensedItem(item, 1)}
                                                        className={`text-left p-3 rounded-xl border text-sm transition-all hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group ${isInMission ? 'bg-teal-50 border-teal-200 hover:border-teal-400 border-2' : 'bg-white border-slate-200 hover:border-emerald-400'}`}
                                                    >
                                                        {isInMission && <div className="absolute top-0 right-0 w-8 h-8 bg-teal-400 -mr-4 -mt-4 transform rotate-45 group-hover:bg-teal-500 transition-colors"></div>}
                                                        <div className="font-bold text-slate-800 line-clamp-1">{item.name}</div>
                                                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1 flex justify-between items-center">
                                                            <span>Est: {item.quantity} {item.unit}</span>
                                                            {isInMission && <span className="text-teal-600 font-black">Missão!</span>}
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-bold text-slate-800 mb-3 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Pill className="w-4 h-4 text-emerald-500" /> Medicamentos Dispensados
                                    </div>
                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs ml-auto">
                                        {pharmacyForm.dispensedItems.length}
                                    </span>
                                </h4>
                                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">
                                                <th className="py-3 px-4">Medicamento</th>
                                                <th className="py-3 px-4 w-32 text-center">Qtde</th>
                                                {editingVisit.status !== 'completed' && <th className="py-3 px-4 w-16 text-center">Del</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {pharmacyForm.dispensedItems.map((disp, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-3 px-4 text-sm font-bold text-slate-700">{disp.name}</td>
                                                    <td className="py-3 px-4 text-center">
                                                        {editingVisit.status !== 'completed' ? (
                                                            <div className="flex justify-center items-center gap-2 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 mx-auto w-max">
                                                                <button type="button" onClick={() => {
                                                                    setPharmacyForm(prev => ({ ...prev, dispensedItems: prev.dispensedItems.map(i => i.itemId === disp.itemId ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i) }))
                                                                }} className="text-slate-400 hover:text-rose-500"><Minus className="w-4 h-4" /></button>
                                                                <span className="font-bold text-slate-800 w-6 text-center">{disp.quantity}</span>
                                                                <button type="button" onClick={() => {
                                                                    setPharmacyForm(prev => ({ ...prev, dispensedItems: prev.dispensedItems.map(i => i.itemId === disp.itemId ? { ...i, quantity: i.quantity + 1 } : i) }))
                                                                }} className="text-slate-400 hover:text-emerald-500"><Plus className="w-4 h-4" /></button>
                                                            </div>
                                                        ) : (
                                                            <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">{disp.quantity}</span>
                                                        )}
                                                    </td>
                                                    {editingVisit.status !== 'completed' && (
                                                        <td className="py-3 px-4 text-center">
                                                            <button type="button" onClick={() => removeDispensedItem(disp.itemId)} className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition-colors">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                            {pharmacyForm.dispensedItems.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="py-8 text-center text-slate-400 text-sm font-medium">
                                                        Nenhum medicamento adicionado à dispensação.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-slate-800 mb-2">Orientações Farmacêuticas</h4>
                                <textarea
                                    className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm resize-none min-h-[100px]"
                                    placeholder="Ex: Tomar o Amoxicilina após as refeições. Retornar em 15 dias caso..."
                                    value={pharmacyForm.notes}
                                    onChange={e => setPharmacyForm(prev => ({ ...prev, notes: e.target.value }))}
                                    disabled={editingVisit.status === 'completed'}
                                />
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsPharmacyModalOpen(false)}
                                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Fechar
                            </button>
                            {editingVisit.status !== 'completed' && (
                                <button
                                    onClick={handleSavePharmacy}
                                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2 transform active:scale-95"
                                >
                                    <CheckCircle className="w-5 h-5" /> Confirmar Entrega
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
