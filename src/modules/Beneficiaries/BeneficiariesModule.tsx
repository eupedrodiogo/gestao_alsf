import React, { useState } from 'react';
import {
    Users, Search, Plus, Edit, Trash2, Download,
    MapPinned, User, Heart, UserPlus, Filter,
    FileSearch, AlertCircle
} from 'lucide-react';
import { Beneficiary } from '../../types/index';
import { exportToCSV } from '../../utils/index';

interface BeneficiariesModuleProps {
    beneficiaries: Beneficiary[];
    userRole: string;
    addBeneficiary: (data: Omit<Beneficiary, 'id'>) => Promise<void>;
    updateBeneficiary: (id: string, data: Partial<Beneficiary>) => Promise<void>;
    deleteBeneficiary: (id: string) => Promise<void>;
    showToast: (title: string, type?: 'success' | 'error' | 'info', message?: string) => void;
    openModal: (beneficiary?: Beneficiary | null) => void;
}

export const BeneficiariesModule: React.FC<BeneficiariesModuleProps> = ({
    beneficiaries,
    userRole,
    deleteBeneficiary,
    showToast,
    openModal
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = (beneficiaries || []).filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.document || '').includes(searchTerm) ||
        (b.cpf || '').includes(searchTerm)
    );

    const handleExport = () => {
        const data = beneficiaries.map(b => ({
            Nome: b.name,
            Documento: b.document || b.cpf || '—',
            Necessidades: b.needs || '—',
            Sexo: b.biologicalSex || '—',
            'Data Nasc': b.birthDate || '—',
            Idade: b.age || '—'
        }));
        exportToCSV(data, 'lista_beneficiarios');
        showToast('Sucesso', 'info', 'Relatório exportado com sucesso.');
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Deseja realmente excluir este cadastro? Os atendimentos vinculados podem ser afetados.')) {
            try {
                await deleteBeneficiary(id);
                showToast('Sucesso', 'success', 'Cadastro excluído!');
            } catch (err) {
                showToast('Erro', 'error', 'Erro ao excluir.');
            }
        }
    };

    const canEdit = ['admin', 'operador', 'recepcao'].includes(userRole);
    const canDelete = userRole === 'admin';

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                            <Users className="w-8 h-8" />
                        </div>
                        Cadastro de Pessoas (Beneficiários)
                    </h2>
                    <p className="text-slate-500 mt-1 font-medium">Gestão centralizada de todos os acolhidos pela missão.</p>
                </div>

                <div className="flex gap-3 w-full lg:w-auto">
                    {canEdit && (
                        <>
                            <button
                                onClick={handleExport}
                                className="flex-1 lg:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <Download className="w-5 h-5" /> Exportar CSV
                            </button>
                            <button
                                onClick={() => openModal(null)}
                                className="flex-1 lg:flex-none px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                            >
                                <UserPlus className="w-5 h-5" /> Novo Cadastro
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Busca */}
            <div className="bg-white p-2 rounded-[32px] border border-slate-200 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, CPF ou documento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-transparent border-none rounded-3xl text-base focus:ring-0 outline-none placeholder:text-slate-400 font-medium"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.length === 0 ? (
                    <div className="col-span-full py-32 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
                        <div className="mx-auto w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <FileSearch className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Ninguém encontrado</h3>
                        <p className="text-slate-500 text-sm italic">Verifique se digitou corretamente ou realize um novo cadastro.</p>
                    </div>
                ) : filtered.map(b => (
                    <div key={b.id} className="group bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden flex flex-col p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    {b.photoUrl ? (
                                        <img src={b.photoUrl} alt={b.name} className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-white" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-2xl font-black text-indigo-600 shadow-inner">
                                            {b.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-xl font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate">{b.name}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {b.document || b.cpf || 'Sem documento'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                {canEdit && (
                                    <button
                                        onClick={() => openModal(b)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        onClick={() => handleDelete(b.id)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 mb-6 flex-1">
                            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Necessidades / Alerta Médico</p>
                                <p className="text-sm font-bold text-slate-600 leading-relaxed line-clamp-3 italic">
                                    {b.needs ? `"${b.needs}"` : 'Nenhuma observação especial registrada para este acolhido.'}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {b.biologicalSex && (
                                    <span className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        {b.biologicalSex === 'masculino' ? 'Masculino' : 'Feminino'}
                                    </span>
                                )}
                                {b.age && (
                                    <span className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        {b.age} anos
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                                <MapPinned className="w-4 h-4 text-indigo-400" />
                                Cadastrado no sistema
                            </div>
                            <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                                Ver Perfil Completo
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
