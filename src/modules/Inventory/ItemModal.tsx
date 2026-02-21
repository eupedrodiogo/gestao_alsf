import React, { useState, useEffect } from 'react';
import { X, Save, Package, Tag, Ruler, Wallet, AlertCircle } from 'lucide-react';
import { Item, Category } from '../../types/index';

interface ItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Omit<Item, 'id'>) => Promise<void>;
    initialData?: Item | null;
}

export const ItemModal: React.FC<ItemModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState<Category>('Outros');
    const [unit, setUnit] = useState('');
    const [quantity, setQuantity] = useState<number>(0);
    const [unitValue, setUnitValue] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setCategory(initialData.category);
            setUnit(initialData.unit);
            setQuantity(initialData.quantity);
            setUnitValue(initialData.unitValue || 0);
        } else {
            resetForm();
        }
    }, [initialData, isOpen]);

    const resetForm = () => {
        setName('');
        setCategory('Outros');
        setUnit('');
        setQuantity(0);
        setUnitValue(0);
        setErrors({});
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!unit.trim()) newErrors.unit = 'Unidade é obrigatória';
        if (quantity < 0) newErrors.quantity = 'Quantidade inválida';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            await onSave({
                name,
                category,
                unit,
                quantity,
                unitValue
            });
            onClose();
        } catch (error) {
            console.error("Error saving item:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center p-8 border-b border-slate-50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            {initialData ? 'Editar Recurso' : 'Novo Recurso'}
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">Cadastre itens no estoque central.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-2xl transition-all">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Item</label>
                            <div className="relative">
                                <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                                <input
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-700 ${errors.name ? 'ring-2 ring-rose-500 bg-rose-50' : ''}`}
                                    placeholder="Ex: Tylenol 500mg, Cesta Básica..."
                                />
                            </div>
                            {errors.name && <p className="text-xs text-rose-500 font-bold ml-1">{errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Categoria</label>
                                <div className="relative">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value as Category)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-700 appearance-none"
                                    >
                                        <option value="Medicamentos">Medicamentos</option>
                                        <option value="Alimentos">Alimentos</option>
                                        <option value="Brinquedos">Brinquedos</option>
                                        <option value="Outros">Outros</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Unidade</label>
                                <div className="relative">
                                    <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                                    <input
                                        required
                                        value={unit}
                                        onChange={e => setUnit(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-700"
                                        placeholder="Ex: cx, kg, un"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Qtd. Inicial</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={e => setQuantity(Number(e.target.value))}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Custo Un. (R$)</label>
                                <div className="relative">
                                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={unitValue}
                                        onChange={e => setUnitValue(Number(e.target.value))}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-700"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? 'Salvando...' : 'Confirmar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
