import React, { useState } from 'react';
import {
    Package, Search, Plus, Download, TrendingUp, TrendingDown,
    Edit, Box, LayoutGrid, Filter, MoreHorizontal, AlertTriangle,
    ShoppingCart, ChevronRight, BarChart3
} from 'lucide-react';
import { Item, Category } from '../../types/index';
import { formatCurrency, exportToCSV } from '../../utils/index';
import { ItemModal } from './ItemModal';
import { StockMovementModal } from './StockMovementModal';

interface InventoryModuleProps {
    items: Item[];
    userRole: string;
    addItem: (item: Omit<Item, 'id'>) => Promise<void>;
    updateItem: (id: string, data: Partial<Item>) => Promise<void>;
    handleStockMovement: (item: Item, quantity: number, isEntry: boolean, fileUrl?: string, fileName?: string) => Promise<void>;
    showToast: (title: string, type?: 'success' | 'error' | 'info', message?: string) => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
    items,
    userRole,
    addItem,
    updateItem,
    handleStockMovement,
    showToast
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);

    const filtered = (items || []).filter(i => {
        const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'all' || i.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const stats = {
        totalItems: items.length,
        totalValue: items.reduce((acc, i) => acc + (i.quantity * (i.unitValue || 0)), 0),
        lowStock: items.filter(i => i.quantity < 20).length
    };

    const handleSaveItem = async (data: Omit<Item, 'id'>) => {
        try {
            if (editingItem) {
                await updateItem(editingItem.id, data);
            } else {
                await addItem(data);
            }
            setIsItemModalOpen(false);
            setEditingItem(null);
            showToast('Sucesso', 'success', 'Item salvo com sucesso!');
        } catch (err) {
            showToast('Erro', 'error', 'Não foi possível salvar o item.');
        }
    };

    const isAdmin = ['admin', 'operador'].includes(userRole);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Elegant Header & Stats */}
            <div className="flex flex-col xl:flex-row justify-between items-start gap-8">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <div className="p-3 bg-blue-600 text-white rounded-3xl shadow-2xl shadow-blue-200">
                            <Package className="w-9 h-9" />
                        </div>
                        Gestão de Estoque
                    </h2>
                    <p className="text-slate-500 mt-2 font-medium bg-slate-100/50 px-4 py-1.5 rounded-full inline-block">
                        Controle centralizado de recursos e suprimentos.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full xl:w-auto">
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                        <BarChart3 className="w-6 h-6 text-blue-500 mb-3" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor do Patrimônio</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">{formatCurrency(stats.totalValue)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                        <Box className="w-6 h-6 text-indigo-500 mb-3" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens Únicos</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.totalItems}</p>
                    </div>
                    <div className={`${stats.lowStock > 0 ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100'} p-6 rounded-[32px] border shadow-sm transition-colors`}>
                        <AlertTriangle className={`w-6 h-6 ${stats.lowStock > 0 ? 'text-rose-500' : 'text-slate-300'} mb-3`} />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Abaixo do Mínimo</p>
                        <p className={`text-2xl font-black ${stats.lowStock > 0 ? 'text-rose-600' : 'text-slate-800'} tracking-tighter`}>{stats.lowStock}</p>
                    </div>
                </div>
            </div>

            {/* Actions & Filters Strip */}
            <div className="bg-white p-3 rounded-[32px] border border-slate-200 shadow-lg shadow-slate-100/50 flex flex-col lg:flex-row justify-between items-center gap-4">
                <div className="flex bg-slate-50 p-1.5 rounded-[22px] w-full lg:w-auto overflow-x-auto no-scrollbar">
                    {(['all', 'Medicamentos', 'Alimentos', 'Brinquedos', 'Outros'] as const).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                                ${activeCategory === cat ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {cat === 'all' ? 'Tudo' : cat}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input
                            type="text"
                            placeholder="Buscar recurso..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-[22px] text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                        />
                    </div>
                    {isAdmin && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsStockModalOpen(true)}
                                className="p-4 bg-slate-900 text-white rounded-[22px] hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-200"
                                title="Movimentação IA"
                            >
                                <TrendingUp className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => {
                                    setEditingItem(null);
                                    setIsItemModalOpen(true);
                                }}
                                className="p-4 bg-blue-600 text-white rounded-[22px] hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-200"
                                title="Novo Cadastro"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Table Perspective */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="pl-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Informação do Recurso</th>
                            <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estoque Atual</th>
                            <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valoração</th>
                            <th className="pr-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-24 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                            <ShoppingCart className="w-10 h-10 text-slate-200" />
                                        </div>
                                        <p className="text-slate-400 font-bold italic">Sem resultados para os filtros aplicados.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filtered.map(item => (
                            <tr key={item.id} className="group hover:bg-blue-50/30 transition-colors">
                                <td className="pl-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 ${item.category === 'Medicamentos' ? 'bg-rose-50 text-rose-600' :
                                            item.category === 'Alimentos' ? 'bg-amber-50 text-amber-600' :
                                                item.category === 'Brinquedos' ? 'bg-purple-50 text-purple-600' :
                                                    'bg-slate-100 text-slate-500'
                                            }`}>
                                            {item.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-slate-800 tracking-tight uppercase">{item.name}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.category}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-6">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-lg font-black tracking-tighter ${item.quantity < 20 ? 'text-rose-600' : 'text-slate-800'}`}>
                                            {item.quantity}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                            {item.unit}
                                        </span>
                                        {item.quantity < 20 && (
                                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                        )}
                                    </div>
                                    <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${item.quantity < 20 ? 'bg-rose-500' : 'bg-blue-500'}`}
                                            style={{ width: `${Math.min((item.quantity / 100) * 100, 100)}%` }}
                                        />
                                    </div>
                                </td>
                                <td className="px-6 py-6">
                                    <p className="text-sm font-bold text-slate-800 tracking-tight">{formatCurrency((item.quantity || 0) * (item.unitValue || 0))}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{formatCurrency(item.unitValue || 0)} / un</p>
                                </td>
                                <td className="pr-8 py-6">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        {isAdmin && (
                                            <>
                                                <button
                                                    onClick={() => setEditingItem(item) || setIsItemModalOpen(true)}
                                                    className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <div className="w-px h-6 bg-slate-100 mx-2" />
                                                <button
                                                    onClick={() => handleStockMovement(item, 10, true)}
                                                    className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all"
                                                >
                                                    <TrendingUp className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleStockMovement(item, 10, false)}
                                                    className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                                                >
                                                    <TrendingDown className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}
                                        <button className="p-3 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-all">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modals Section */}
            <ItemModal
                isOpen={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                onSave={handleSaveItem}
                initialData={editingItem}
            />

            <StockMovementModal
                isOpen={isStockModalOpen}
                items={items}
                onClose={() => setIsStockModalOpen(false)}
                onConfirm={handleStockMovement}
            />
        </div>
    );
};
