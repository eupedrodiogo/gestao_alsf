import React, { useState } from 'react';
import {
    Heart, Search, Plus, Edit, Trash2, Phone, Mail,
    Calendar as CalendarIcon, Stethoscope, User, Filter,
    Settings, MoreVertical, CheckCircle2, XCircle
} from 'lucide-react';
import { Volunteer } from '../../types/index';
import { VolunteerModal } from '../../components/modals/VolunteerModal';

interface VolunteersModuleProps {
    volunteers: Volunteer[];
    addVolunteer: (volunteer: Omit<Volunteer, 'id'>) => Promise<void>;
    updateVolunteer: (id: string, data: Partial<Volunteer>) => Promise<void>;
    deleteVolunteer: (id: string) => Promise<void>;
    showToast: (title: string, type?: 'success' | 'error' | 'info', message?: string) => void;
}

export const VolunteersModule: React.FC<VolunteersModuleProps> = ({
    volunteers,
    addVolunteer,
    updateVolunteer,
    deleteVolunteer,
    showToast
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
    const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const filtered = (volunteers || []).filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.role.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = activeFilter === 'all' ||
            (activeFilter === 'active' ? v.active : !v.active);
        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: volunteers.length,
        active: volunteers.filter(v => v.active).length,
        inactive: volunteers.filter(v => !v.active).length
    };

    const handleSave = async (data: Omit<Volunteer, 'id'>) => {
        try {
            if (editingVolunteer) {
                await updateVolunteer(editingVolunteer.id, data);
                showToast('Sucesso', 'success', 'Voluntário atualizado com sucesso!');
            } else {
                await addVolunteer(data);
                showToast('Sucesso', 'success', 'Novo voluntário cadastrado!');
            }
            setIsModalOpen(false);
            setEditingVolunteer(null);
        } catch (err) {
            showToast('Erro', 'error', 'Não foi possível salvar os dados.');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este voluntário? Esta ação é irreversível.')) {
            try {
                await deleteVolunteer(id);
                showToast('Sucesso', 'success', 'Voluntário removido da base.');
            } catch (err) {
                showToast('Erro', 'error', 'Erro ao excluir voluntário.');
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header com Stats */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                            <Heart className="w-8 h-8" />
                        </div>
                        Base de Voluntários
                    </h2>
                    <p className="text-slate-500 mt-1 font-medium">Gerencie a equipe de amor e serviço do Lar.</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ativos</p>
                            <p className="text-lg font-black text-emerald-600">{stats.active}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-100" />
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                            <p className="text-lg font-black text-slate-800">{stats.total}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Barra de Ações */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setActiveFilter('active')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeFilter === 'active' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-emerald-700'}`}
                    >
                        Ativos
                    </button>
                    <button
                        onClick={() => setActiveFilter('inactive')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeFilter === 'inactive' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-emerald-700'}`}
                    >
                        Inativos
                    </button>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou função..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingVolunteer(null);
                            setIsModalOpen(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5 font-black" />
                        <span className="text-sm font-bold hidden sm:inline">Adicionar</span>
                    </button>
                </div>
            </div>

            {/* Grid de Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.length === 0 ? (
                    <div className="col-span-full py-32 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
                        <div className="mx-auto w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <User className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Nenhum voluntário encontrado</h3>
                        <p className="text-slate-500 text-sm">Tente ajustar sua busca ou filtros.</p>
                    </div>
                ) : filtered.map(v => (
                    <div key={v.id} className="group bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 overflow-hidden flex flex-col">
                        <div className="p-6 flex-1">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner ${v.active ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                                            {v.name.charAt(0).toUpperCase()}
                                        </div>
                                        {v.active ? (
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                                                <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                                            </div>
                                        ) : (
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-300 rounded-full border-4 border-white" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{v.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                                                {v.role}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={() => { setEditingVolunteer(v); setIsModalOpen(true); }}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(v.id)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {v.crm && (
                                    <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                                        <Stethoscope className="w-4 h-4 text-indigo-500" />
                                        <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">
                                            {(v.role.toLowerCase().includes('médico') || v.role.toLowerCase().includes('medico')) ? 'CRM' :
                                                (v.role.toLowerCase().includes('farmacêutico') || v.role.toLowerCase().includes('farmaceutico')) ? 'CRF' : 'Registro'}: {v.crm}
                                        </span>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center gap-3 text-slate-500 group/item">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover/item:bg-indigo-50 transition-colors">
                                            <Phone className="w-4 h-4 group-hover/item:text-indigo-500" />
                                        </div>
                                        <span className="text-sm font-bold tracking-tight">{v.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-500 group/item">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover/item:bg-indigo-50 transition-colors">
                                            <Mail className="w-4 h-4 group-hover/item:text-indigo-500" />
                                        </div>
                                        <span className="text-sm font-medium tracking-tight truncate">{v.email || '— — —'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-500 group/item">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover/item:bg-indigo-50 transition-colors">
                                            <CalendarIcon className="w-4 h-4 group-hover/item:text-indigo-500" />
                                        </div>
                                        <span className="text-sm font-medium leading-tight">{v.availability || 'Não informado'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`px-6 py-4 flex items-center justify-between border-t transition-colors ${v.active ? 'bg-emerald-50/30 border-emerald-100/50' : 'bg-slate-50/50 border-slate-100'}`}>
                            <div className="flex items-center gap-2">
                                {v.active ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-slate-400" />
                                )}
                                <span className={`text-[10px] font-black uppercase tracking-widest ${v.active ? 'text-emerald-700' : 'text-slate-500'}`}>
                                    {v.active ? 'Colaborando' : 'Afastado'}
                                </span>
                            </div>
                            {v.notes && (
                                <p className="text-[11px] text-slate-400 italic max-w-[120px] truncate" title={v.notes}>
                                    "{v.notes}"
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <VolunteerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingVolunteer}
            />
        </div>
    );
};
