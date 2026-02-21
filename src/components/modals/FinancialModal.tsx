import React, { useState, useEffect, useRef } from 'react';
import { Transaction, Mission } from '../../types/index';
import { X, Save, DollarSign, Calendar, Tag, CreditCard, User, AlignLeft, Receipt, Upload, FileText, Link, Briefcase } from 'lucide-react';

interface FinancialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Omit<Transaction, 'id'>, file?: File | null) => Promise<void>;
    initialData?: Partial<Transaction> | null;
    missions?: Mission[];
}

export const FinancialModal: React.FC<FinancialModalProps> = ({ isOpen, onClose, onSave, initialData, missions = [] }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<'paid' | 'pending'>('pending');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pix' | 'card' | 'transfer'>('pix');
    const [person, setPerson] = useState('');
    const [missionId, setMissionId] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData && initialData.description) {
                // Editing existing transaction
                setDescription(initialData.description || '');
                setAmount(initialData.amount?.toString() || '');
                setType(initialData.type || 'expense');
                setCategory(initialData.category || '');
                setDate(initialData.date || new Date().toISOString().split('T')[0]);
                setStatus(initialData.status || 'pending');
                setPaymentMethod(initialData.paymentMethod || 'pix');
                setPerson(initialData.person || '');
                setMissionId(initialData.missionId || '');
            } else {
                // New transaction or resetting to defaults
                resetForm();
                // If initialData has partial data (like type from the "New Transaction" button)
                if (initialData?.type) setType(initialData.type);
            }
        }
    }, [initialData, isOpen]);

    const resetForm = () => {
        setDescription('');
        setAmount('');
        setType('expense');
        setCategory('');
        setDate(new Date().toISOString().split('T')[0]);
        setStatus('pending');
        setPaymentMethod('pix');
        setPerson('');
        setMissionId('');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                description,
                amount: parseFloat(amount) || 0,
                type,
                category,
                date,
                status,
                paymentMethod,
                person: person || undefined,
                missionId: missionId || undefined,
                docUrl: initialData?.docUrl
            }, file || null);
            onClose();
            resetForm();
        } catch (error) {
            console.error("Error saving transaction:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const incomeCategories = ['Doação', 'Venda', 'Evento', 'Governo', 'Outros'];
    const expenseCategories = ['Alimentação', 'Medicamentos', 'Manutenção', 'Contas', 'Pessoal', 'Material de Limpeza', 'Outros'];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-left">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            {initialData?.id ? 'Editar Transação' : 'Nova Transação'}
                            <span className={`text-xs px-2 py-1 rounded-full border ${type === 'income' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                {type === 'income' ? 'Receita' : 'Despesa'}
                            </span>
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {initialData?.id ? 'Atualize os dados da transação' : 'Registre uma nova entrada ou saída'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-200 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Type Selection */}
                    <div className="flex p-1 bg-slate-100 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-emerald-600'}`}
                        >
                            <DollarSign className="w-4 h-4" /> Receita (Entrada)
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('expense')}
                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${type === 'expense' ? 'bg-white text-red-500 shadow-sm' : 'text-slate-500 hover:text-red-500'}`}
                        >
                            <DollarSign className="w-4 h-4" /> Despesa (Saída)
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Description */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <AlignLeft size={16} className="text-indigo-600" />
                                Descrição
                            </label>
                            <input
                                type="text"
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="Ex: Compra de frutas para a semana"
                            />
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <DollarSign size={16} className="text-indigo-600" />
                                Valor (R$)
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono font-medium text-lg"
                                placeholder="0.00"
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Tag size={16} className="text-indigo-600" />
                                Categoria
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                                required
                            >
                                <option value="" disabled>Selecione uma categoria</option>
                                {(type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Calendar size={16} className="text-indigo-600" />
                                Data
                            </label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <CreditCard size={16} className="text-indigo-600" />
                                Meio de Pagamento
                            </label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as any)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                            >
                                <option value="pix">PIX</option>
                                <option value="cash">Dinheiro</option>
                                <option value="card">Cartão</option>
                                <option value="transfer">Transferência</option>
                            </select>
                        </div>

                        {/* Person (Entity) */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <User size={16} className="text-indigo-600" />
                                Pessoa/Entidade (Opcional)
                            </label>
                            <input
                                type="text"
                                value={person}
                                onChange={(e) => setPerson(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="Quem pagou ou recebeu?"
                            />
                        </div>

                        {/* Mission Link */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Briefcase size={16} className="text-indigo-600" />
                                Vincular a Missão (Opcional)
                            </label>
                            <select
                                value={missionId}
                                onChange={(e) => setMissionId(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                            >
                                <option value="">Sem vínculo com missão</option>
                                {missions.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.title} - {new Date(m.date).toLocaleDateString()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Toggle */}
                        <div className="md:col-span-2 flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                    <Receipt size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-700">Status da Transação</p>
                                    <p className="text-xs text-slate-500">
                                        {status === 'paid' ? 'A transação já foi liquidada (paga/recebida).' : 'A transação está pendente ou agendada.'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setStatus(prev => prev === 'paid' ? 'pending' : 'paid')}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${status === 'paid'
                                    ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-lg hover:bg-emerald-600'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {status === 'paid' ? 'Concluído' : 'Pendente'}
                            </button>
                        </div>

                        {/* File Upload */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <FileText size={16} className="text-indigo-600" />
                                Comprovante / Nota Fiscal
                            </label>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setFile(e.target.files[0]);
                                    }
                                }}
                                className="hidden"
                                accept="image/*,.pdf"
                            />

                            <div className="flex flex-col gap-2">
                                {initialData?.docUrl && !file && (
                                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Link size={16} />
                                            <span className="text-sm font-medium">Comprovante atual</span>
                                        </div>
                                        <a
                                            href={initialData.docUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline"
                                        >
                                            Visualizar
                                        </a>
                                    </div>
                                )}

                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                            setFile(e.dataTransfer.files[0]);
                                        }
                                    }}
                                    className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-50 ${file ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300'}`}
                                >
                                    {file ? (
                                        <>
                                            <FileText className="w-8 h-8 text-emerald-500 mb-2" />
                                            <p className="text-sm font-bold text-emerald-700">{file.name}</p>
                                            <p className="text-xs text-emerald-600">Clique para alterar</p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                            <p className="text-sm font-medium text-slate-600">Clique para anexar arquivo</p>
                                            <p className="text-xs text-slate-400">PDF ou Imagem (Max 5MB)</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg transition-colors font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-red-500 hover:bg-red-600 shadow-red-200'}`}
                        >
                            <Save size={18} />
                            {loading ? 'Salvando...' : 'Salvar Transação'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
