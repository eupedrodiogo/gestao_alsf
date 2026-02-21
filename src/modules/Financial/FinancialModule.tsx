import React, { useState, useMemo } from 'react';
import {
    DollarSign, Plus, ArrowUpRight, ArrowDownLeft,
    ClipboardList, Briefcase, FileText, Trash2, Edit,
    Search, Filter, Heart, HandCoins, Users, Megaphone,
    TrendingUp, Calendar, Download, PieChart, Wallet
} from 'lucide-react';
import { Transaction, Mission } from '../../types/index';
import { formatCurrency } from '../../utils/index';
import { FinancialModal } from '../../components/modals/FinancialModal';

interface FinancialModuleProps {
    transactions: Transaction[];
    missions: Mission[];
    updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
    addTransaction: (data: Omit<Transaction, 'id'>, file?: File | null, transactionId?: string) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    showToast: (title: string, type?: 'success' | 'error' | 'info', message?: string) => void;
    initialTab?: 'financial' | 'fundraising';
}

export const FinancialModule: React.FC<FinancialModuleProps> = ({
    transactions,
    missions,
    updateTransaction,
    addTransaction,
    deleteTransaction,
    showToast,
    initialTab = 'financial'
}) => {
    const [activeSubTab, setActiveSubTab] = useState<'all' | 'income' | 'expense'>(
        initialTab === 'fundraising' ? 'income' : 'all'
    );
    const [viewMode, setViewMode] = useState<'financial' | 'fundraising'>(initialTab);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Partial<Transaction> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // --- Data Processing ---
    const allTransactionsSorted = useMemo(() => {
        return [...(transactions || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        return allTransactionsSorted.filter(t => {
            const matchesTab = activeSubTab === 'all' || t.type === activeSubTab;
            const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.person || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.category || '').toLowerCase().includes(searchTerm.toLowerCase());

            if (viewMode === 'fundraising') {
                // In fundraising view, we primarily focus on income with categories: Doação, Campanha, Evento
                const isFundraisingCategory = ['Doação', 'Campanha', 'Evento'].includes(t.category);
                return matchesSearch && t.type === 'income' && isFundraisingCategory;
            }

            return matchesTab && matchesSearch;
        });
    }, [allTransactionsSorted, activeSubTab, searchTerm, viewMode]);

    const stats = useMemo(() => {
        const totalIncome = allTransactionsSorted
            .filter(t => t.type === 'income' && t.status === 'paid')
            .reduce((acc, t) => acc + t.amount, 0);

        const totalExpense = allTransactionsSorted
            .filter(t => t.type === 'expense' && t.status === 'paid')
            .reduce((acc, t) => acc + t.amount, 0);

        const pendingIncome = allTransactionsSorted
            .filter(t => t.type === 'income' && t.status === 'pending')
            .reduce((acc, t) => acc + t.amount, 0);

        const pendingExpense = allTransactionsSorted
            .filter(t => t.type === 'expense' && t.status === 'pending')
            .reduce((acc, t) => acc + t.amount, 0);

        const fundraisingTotal = allTransactionsSorted
            .filter(t => t.type === 'income' && ['Doação', 'Campanha', 'Evento'].includes(t.category))
            .reduce((acc, t) => acc + t.amount, 0);

        return {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            pendingIncome,
            pendingExpense,
            fundraisingTotal,
            uniqueDonors: new Set(allTransactionsSorted.filter(t => t.category === 'Doação').map(t => t.person)).size
        };
    }, [allTransactionsSorted]);

    // --- Actions ---
    const handleAdd = (type?: 'income' | 'expense') => {
        setEditingTransaction({
            type: type || 'expense',
            date: new Date().toISOString().split('T')[0],
            status: 'pending',
            paymentMethod: 'pix',
            category: ''
        });
        setIsModalOpen(true);
    };

    const handleEdit = (t: Transaction) => {
        setEditingTransaction(t);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Deseja realmente excluir esta transação?')) {
            try {
                await deleteTransaction(id);
                showToast('Sucesso', 'success', 'Transação excluída!');
            } catch (err) {
                showToast('Erro', 'error', 'Não foi possível excluir.');
            }
        }
    };

    const toggleStatus = async (t: Transaction) => {
        try {
            await updateTransaction(t.id, { status: t.status === 'paid' ? 'pending' : 'paid' });
            showToast('Atualizado', 'info', `Status alterado para ${t.status === 'paid' ? 'Pendente' : 'Pago'}`);
        } catch (err) {
            showToast('Erro', 'error', 'Falha ao atualizar status.');
        }
    };

    // --- Renderers ---
    const renderSummary = () => (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <ArrowUpRight className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Receitas</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">{formatCurrency(stats.totalIncome)}</h3>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                        Confirmadas no período
                    </p>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                            <ArrowDownLeft className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Despesas</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">{formatCurrency(stats.totalExpense)}</h3>
                    <p className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                        Saídas liquidadas
                    </p>
                </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-white/10 text-indigo-400 rounded-lg">
                            <Wallet className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo em Conta</span>
                    </div>
                    <h3 className={`text-2xl font-black ${stats.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(stats.balance)}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">Líquido disponível</p>
                </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-5 rounded-2xl shadow-lg shadow-indigo-200 relative overflow-hidden group">
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full -mb-8 -mr-8" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-white/20 text-white rounded-lg">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider">Pendente</span>
                    </div>
                    <h3 className="text-2xl font-black text-white">{formatCurrency(stats.pendingIncome - stats.pendingExpense)}</h3>
                    <p className="text-[10px] text-indigo-50/70 font-bold mt-1 italic">Previsão p/ próximos dias</p>
                </div>
            </div>
        </div>
    );

    const renderFundraisingSummary = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-rose-100 opacity-20 pointer-events-none">
                    <Heart className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                    <p className="text-xs font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Heart className="w-4 h-4" /> Total Arrecadado
                    </p>
                    <h3 className="text-4xl font-black text-slate-800">{formatCurrency(stats.fundraisingTotal)}</h3>
                    <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full" style={{ width: '65%' }} />
                        </div>
                        <span className="text-sm font-black text-slate-600">65%</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Meta de Arrecadação: <strong className="text-slate-700">R$ 150.000,00</strong></p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm group">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Doadores Únicos</p>
                        <h3 className="text-3xl font-black text-slate-800">{stats.uniqueDonors}</h3>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-500">Pessoas Físicas</span>
                        <span className="text-indigo-600">82%</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-500">Empresas Parceiras</span>
                        <span className="text-indigo-600">18%</span>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 p-6 rounded-3xl shadow-xl shadow-indigo-200 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                    <h4 className="text-lg font-bold flex items-center gap-2 mb-2">
                        <Megaphone className="w-5 h-5 text-indigo-300" />
                        Nova Campanha?
                    </h4>
                    <p className="text-sm text-indigo-100/80 leading-relaxed mb-4">
                        Crie um link de arrecadação personalizado para divulgar no WhatsApp e redes sociais.
                    </p>
                    <button className="w-full bg-white text-indigo-900 font-bold py-2.5 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">
                        Criar Link de Doação
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Main Header & Toggle */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className={`p-2 rounded-2xl shadow-sm ${viewMode === 'financial' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                            {viewMode === 'financial' ? <DollarSign className="w-8 h-8" /> : <Heart className="w-8 h-8" />}
                        </div>
                        {viewMode === 'financial' ? 'Gestão Financeira' : 'Arrecadação & Doações'}
                    </h2>
                    <p className="text-slate-500 mt-1 font-medium">Controle de fluxo de caixa, pagamentos e recebimentos.</p>
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full lg:w-auto">
                    <button
                        onClick={() => setViewMode('financial')}
                        className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${viewMode === 'financial' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <PieChart className="w-4 h-4" /> Financeiro
                    </button>
                    <button
                        onClick={() => setViewMode('fundraising')}
                        className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${viewMode === 'fundraising' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <Heart className="w-4 h-4" /> Arrecadação
                    </button>
                </div>
            </div>

            {/* Dashboard Area */}
            {viewMode === 'financial' ? renderSummary() : renderFundraisingSummary()}

            {/* Filter & List Area */}
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-wrap gap-2">
                        {viewMode === 'financial' ? (
                            <>
                                <button
                                    onClick={() => setActiveSubTab('all')}
                                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'all' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                                >
                                    Todos
                                </button>
                                <button
                                    onClick={() => setActiveSubTab('income')}
                                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'income' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white text-slate-500 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'}`}
                                >
                                    Receitas
                                </button>
                                <button
                                    onClick={() => setActiveSubTab('expense')}
                                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'expense' ? 'bg-rose-600 text-white shadow-lg shadow-rose-100' : 'bg-white text-slate-500 border border-slate-200 hover:bg-rose-50 hover:text-rose-600'}`}
                                >
                                    Despesas
                                </button>
                            </>
                        ) : (
                            <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-rose-500" /> Histórico de Doações
                            </h3>
                        )}
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por descrição ou pessoa..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <button
                            onClick={() => handleAdd(viewMode === 'fundraising' ? 'income' : 'expense')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                        >
                            <Plus className="w-5 h-5 font-black" />
                            <span className="text-sm font-bold hidden sm:inline">Lançar</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Informações</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-30">
                                            <Search className="w-12 h-12 text-slate-300" />
                                            <p className="text-sm font-bold text-slate-400">Nenhuma transação encontrada.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTransactions.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1">
                                                {t.type === 'income' ?
                                                    (t.category === 'Doação' ? <Heart className="w-5 h-5 text-rose-500" /> : <ArrowUpRight className="w-5 h-5 text-emerald-500" />) :
                                                    <ArrowDownLeft className="w-5 h-5 text-rose-500" />
                                                }
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 leading-tight">{t.description}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                    </span>
                                                    {t.person && (
                                                        <span className="text-xs text-indigo-500 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                                                            {t.person}
                                                        </span>
                                                    )}
                                                </div>
                                                {t.missionId && (
                                                    <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 font-black uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded w-fit">
                                                        <Briefcase className="w-3 h-3" />
                                                        {missions.find(m => m.id === t.missionId)?.title || 'Vínculo Missionário'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                                            {t.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className={`text-lg font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                            {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{t.paymentMethod}</p>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <button
                                            onClick={() => toggleStatus(t)}
                                            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${t.status === 'paid'
                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                                        >
                                            {t.status === 'paid' ? 'Liquidado' : 'Pendente'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            {t.docUrl && (
                                                <a
                                                    href={t.docUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
                                                    title="Ver Comprovante"
                                                >
                                                    <FileText className="w-5 h-5" />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleEdit(t)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors"
                                                title="Editar"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-slate-50 bg-slate-50/20 text-right">
                    <button className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-2 ml-auto">
                        <Download className="w-4 h-4" /> Exportar Relatório (CSV)
                    </button>
                </div>
            </div>

            {/* Modal */}
            <FinancialModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={async (data, file) => {
                    await addTransaction(data, file, editingTransaction?.id);
                    setIsModalOpen(false);
                }}
                initialData={editingTransaction}
                missions={missions}
            />
        </div>
    );
};
