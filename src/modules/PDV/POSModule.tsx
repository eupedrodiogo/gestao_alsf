import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Search, Trash2, Tag, Gift, FileText, CheckCircle, Receipt, X, DollarSign, CreditCard, Banknote, History, Store, Heart, Package, Calendar as CalendarIcon, Clock, Printer } from 'lucide-react';
import { Item, Category, Transaction } from '../../types/index';
import { formatCurrency } from '../../utils/index';
import { INITIAL_ITEMS } from '../../utils/mocks';

interface POSModuleProps {
    items: Item[];
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<string | void>;
    updateItem: (itemId: string, data: Partial<Item>) => Promise<void>;
    deleteTransaction: (transactionId: string) => Promise<void>;
}

export const POSModule = ({ items, transactions, addTransaction, updateItem, deleteTransaction }: POSModuleProps) => {
    const [cart, setCart] = useState<{ item: Item; quantity: number }[]>([]);
    const [posSearch, setPosSearch] = useState('');
    const [posCategory, setPosCategory] = useState<'all' | Category>('all');
    const [isProcessing, setIsProcessing] = useState(false);
    const [posMode, setPosMode] = useState<'sales' | 'reports'>('sales');
    const [posDiscount, setPosDiscount] = useState(0);
    const [showReceipt, setShowReceipt] = useState<{ items: any[], total: number, method: string } | null>(null);
    const [posReportDate, setPosReportDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const posItems = (items || INITIAL_ITEMS).filter(i =>
        (i.category === 'Brinquedos' || i.category === 'Alimentos' || i.category === 'Outros') &&
        i.name.toLowerCase().includes(posSearch.toLowerCase()) &&
        (posCategory === 'all' || i.category === posCategory)
    );

    const cartSubtotal = cart.reduce((acc, curr) => acc + (curr.item.unitValue * curr.quantity), 0);
    const cartTotal = cartSubtotal * (1 - (posDiscount / 100));

    const addToCart = (item: Item) => {
        setCart(prev => {
            const existing = prev.find(c => c.item.id === item.id);
            if (existing) {
                if (existing.quantity >= item.quantity) {
                    alert('Estoque insuficiente no inventário.');
                    return prev;
                }
                return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
            }
            return [...prev, { item, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => prev.filter(c => c.item.id !== itemId));
    };

    const updateCartQty = (itemId: string, delta: number) => {
        setCart(prev => prev.map(c => {
            if (c.item.id === itemId) {
                const newQty = c.quantity + delta;
                if (newQty <= 0) return c;
                if (newQty > c.item.quantity) {
                    alert('Limite de estoque atingido.');
                    return c;
                }
                return { ...c, quantity: newQty };
            }
            return c;
        }).filter(c => c.quantity > 0));
    };

    const handleCheckout = async (method: Transaction['paymentMethod']) => {
        if (cart.length === 0) return;

        setIsProcessing(true);
        try {
            await addTransaction({
                description: `Venda PDV - ${cart.length} itens`,
                amount: cartTotal,
                type: 'income',
                category: 'Venda Geral',
                date: new Date().toISOString().split('T')[0],
                status: 'paid',
                paymentMethod: method,
                person: 'Cliente PDV'
            });

            for (const cartItem of cart) {
                await updateItem(cartItem.item.id, {
                    quantity: Math.max(0, cartItem.item.quantity - cartItem.quantity)
                });
            }

            setShowReceipt({ items: [...cart], total: cartTotal, method });

            setCart([]);
            setPosDiscount(0);
        } catch (err) {
            console.error(err);
            alert('Falha ao processar checkout.');
        } finally {
            setIsProcessing(false);
        }
    };

    const categories: ('all' | Category)[] = ['all', 'Brinquedos', 'Alimentos', 'Outros'];

    const renderPOSReports = () => {
        const posSales = (transactions || []).filter(t => t.category === 'Venda Geral' || t.description.includes('PDV'));
        const periodSales = posSales.filter(t => t.date === posReportDate);
        const totalPeriod = periodSales.reduce((acc, curr) => acc + curr.amount, 0);

        return (
            <div className="flex-1 flex flex-col gap-6 animate-in slide-in-from-bottom-5 duration-500 overflow-hidden">
                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-blue-500" /> Data do Relatório</h3>
                    <input
                        type="date"
                        value={posReportDate}
                        onChange={e => setPosReportDate(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Vendas no Período</p>
                        <p className="text-4xl font-black text-slate-900">{periodSales.length}</p>
                    </div>
                    <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl shadow-blue-200 text-white">
                        <p className="text-[10px] font-black uppercase text-blue-200 tracking-widest mb-1">Faturamento no Período</p>
                        <p className="text-4xl font-black">{formatCurrency(totalPeriod)}</p>
                    </div>
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Faturamento Geral PDV</p>
                        <p className="text-4xl font-black">
                            {formatCurrency(posSales.reduce((acc, curr) => acc + curr.amount, 0))}
                        </p>
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
                        <h4 className="font-bold text-slate-800">Histórico de Vendas ({posReportDate.split('-').reverse().join('/')})</h4>
                        <div className="flex gap-2">
                            <div className="bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 border border-slate-100 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Atualizado agora
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 pt-4">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                    <th className="pb-4">Data/ID</th>
                                    <th className="pb-4">Descrição</th>
                                    <th className="pb-4">Pagamento</th>
                                    <th className="pb-4 text-right">Valor</th>
                                    <th className="pb-4 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {periodSales.sort((a, b) => b.id.localeCompare(a.id)).map(s => (
                                    <tr key={s.id} className="group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                                        <td className="py-4">
                                            <p className="text-[11px] font-bold text-slate-800">{s.date}</p>
                                            <p className="text-[9px] text-slate-400 truncate w-24" title={s.id}>{s.id}</p>
                                        </td>
                                        <td className="py-4 text-sm font-medium text-slate-600">{s.description}</td>
                                        <td className="py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${s.paymentMethod === 'pix' ? 'bg-blue-50 text-blue-600' :
                                                s.paymentMethod === 'card' ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                {s.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="py-4 text-sm font-black text-slate-800 text-right">{formatCurrency(s.amount)}</td>
                                        <td className="py-4 text-right">
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Deseja cancelar esta venda e estornar o valor? (Aviso: o estoque não será devolvido automaticamente nesta versão)')) {
                                                        await deleteTransaction(s.id);
                                                    }
                                                }}
                                                className="text-slate-400 hover:text-rose-500 p-2 transition-colors ml-auto flex" title="Cancelar Venda"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {periodSales.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400 text-sm font-medium">
                                            Nenhuma venda encontrada para esta data.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-140px)]">
            {/* Sub-Header / Navigation */}
            <div className="flex justify-between items-center bg-slate-50/50 p-2 rounded-[2rem] border border-slate-100">
                <div className="flex gap-1">
                    <button
                        onClick={() => setPosMode('sales')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all ${posMode === 'sales' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <Store className="w-4 h-4" /> PDV OPERACIONAL
                    </button>
                    <button
                        onClick={() => setPosMode('reports')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all ${posMode === 'reports' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <History className="w-4 h-4" /> RELATÓRIO DE VENDAS
                    </button>
                </div>
                {posMode === 'sales' && (
                    <div className="pr-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Caixa Aberto: </span>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">● Online</span>
                    </div>
                )}
            </div>

            {posMode === 'reports' ? renderPOSReports() : (
                <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden animate-in fade-in duration-500">
                    {/* Product Grid Area (existing content here) */}
                    <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                        {/* Filters */}
                        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Escaneie ou busque o produto..."
                                    value={posSearch}
                                    onChange={e => setPosSearch(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                />
                            </div>
                            <div className="flex gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setPosCategory(cat)}
                                        className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${posCategory === cat
                                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100'
                                            : 'text-slate-500 hover:bg-white/50'
                                            }`}
                                    >
                                        {cat === 'all' ? 'Tudo' : cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 pb-6">
                            {posItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => addToCart(item)}
                                    className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
                                >
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100">
                                        <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-xl shadow-blue-200">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className="w-full aspect-square bg-slate-50 rounded-[1.5rem] mb-4 flex items-center justify-center relative overflow-hidden group-hover:bg-blue-50 transition-colors">
                                        {item.category === 'Brinquedos' ? <Heart className="w-10 h-10 text-pink-400/30" /> : <Package className="w-10 h-10 text-blue-400/30" />}
                                    </div>
                                    <div className="px-1">
                                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">{item.name}</h4>
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">{item.category}</p>
                                        <div className="mt-4 flex justify-between items-end">
                                            <span className="text-blue-600 font-black text-lg">{formatCurrency(item.unitValue)}</span>
                                            <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border ${item.quantity < 5 ? 'bg-rose-50 border-rose-100 text-rose-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                                {item.quantity} {item.unit}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {posItems.length === 0 && (
                                <div className="col-span-full py-20 text-center text-slate-400">
                                    <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="font-medium">Nenhum produto encontrado.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cart / Summary Area */}
                    <div className="w-full lg:w-[420px] flex flex-col h-full animate-in slide-in-from-right duration-700">
                        <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl flex-1 flex flex-col overflow-hidden text-white border border-slate-800">
                            <div className="p-8 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
                                <h3 className="font-bold text-lg flex items-center gap-4">
                                    <div className="bg-blue-500/20 p-3 rounded-2xl ring-1 ring-blue-500/30">
                                        <ShoppingCart className="w-6 h-6 text-blue-400" />
                                    </div>
                                    Carrinho
                                </h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setCart([])}
                                        className="text-[10px] font-black uppercase text-slate-500 hover:text-rose-400 transition-colors"
                                    >
                                        LIMPAR
                                    </button>
                                    <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-4 py-1.5 rounded-full text-xs font-black ring-1 ring-blue-500/20">
                                        {cart.length}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                {cart.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4">
                                        <ShoppingCart className="w-16 h-16 opacity-10" />
                                        <p className="text-sm font-bold tracking-tight uppercase opacity-40">Nenhum item selecionado</p>
                                    </div>
                                ) : (
                                    cart.map(c => (
                                        <div key={c.item.id} className="flex gap-5 items-center group animate-in slide-in-from-right-10 duration-500">
                                            <div className="bg-white/5 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:bg-white/10 transition-colors border border-white/5">
                                                <Package className="w-6 h-6 text-slate-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-[13px] text-slate-200 line-clamp-1 leading-tight group-hover:text-white transition-colors">{c.item.name}</p>
                                                <p className="text-[11px] text-slate-500 font-bold mt-1 tracking-wide">{formatCurrency(c.item.unitValue)}</p>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-1.5 px-3 border border-white/5 ring-1 ring-white/5 shadow-inner">
                                                <button onClick={() => updateCartQty(c.item.id, -1)} className="text-slate-500 hover:text-rose-400 transition-colors p-1"><Minus className="w-3 h-3" /></button>
                                                <span className="text-sm font-black min-w-[14px] text-center text-blue-400">{c.quantity}</span>
                                                <button onClick={() => updateCartQty(c.item.id, 1)} className="text-slate-500 hover:text-emerald-400 transition-colors p-1"><Plus className="w-3 h-3" /></button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(c.item.id)}
                                                className="text-slate-700 hover:text-rose-500 transition-all transform hover:scale-110 p-1"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-8 bg-slate-950/80 border-t border-slate-800/50 space-y-6 backdrop-blur-xl">
                                {/* Discount Selector */}
                                <div className="flex items-center justify-between gap-2 p-2 bg-white/5 rounded-2xl border border-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-3">Desconto</span>
                                    <div className="flex gap-1">
                                        {[0, 5, 10, 15].map(d => (
                                            <button
                                                key={d}
                                                onClick={() => setPosDiscount(d)}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${posDiscount === d ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-400'}`}
                                            >
                                                {d}%
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                                            <span>Subtotal</span>
                                            <span>{formatCurrency(cartSubtotal)}</span>
                                        </div>
                                        {posDiscount > 0 && (
                                            <div className="flex justify-between text-rose-400 text-[11px] font-bold uppercase tracking-wider">
                                                <span>Desconto ({posDiscount}%)</span>
                                                <span>-{formatCurrency(cartSubtotal * (posDiscount / 100))}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-baseline text-white">
                                        <span className="text-sm font-black uppercase tracking-[0.2em] opacity-40">Total</span>
                                        <span className="text-4xl font-black tracking-tighter text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                                            {formatCurrency(cartTotal)}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleCheckout('pix')}
                                        disabled={cart.length === 0 || isProcessing}
                                        className="group bg-white/5 hover:bg-white/10 border border-white/10 py-5 rounded-[1.5rem] flex flex-col items-center gap-2 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                                    >
                                        <div className="p-2.5 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                                            <DollarSign className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">PIX</span>
                                    </button>
                                    <button
                                        onClick={() => handleCheckout('card')}
                                        disabled={cart.length === 0 || isProcessing}
                                        className="group bg-white/5 hover:bg-white/10 border border-white/10 py-5 rounded-[1.5rem] flex flex-col items-center gap-2 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                                    >
                                        <div className="p-2.5 rounded-xl bg-teal-500/10 group-hover:bg-teal-500/20 transition-colors">
                                            <CreditCard className="w-6 h-6 text-teal-400" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">Cartão</span>
                                    </button>
                                    <button
                                        onClick={() => handleCheckout('cash')}
                                        disabled={cart.length === 0 || isProcessing}
                                        className="col-span-2 relative group overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-blue-600 rounded-[1.5rem] transition-all group-hover:bg-blue-500 shadow-xl shadow-blue-950/20" />
                                        <div className="relative py-5 flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-30">
                                            <Banknote className="w-6 h-6 text-white" />
                                            <span className="font-black text-[11px] uppercase tracking-[0.2em] text-white">Dinheiro</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Receipt Modal */}
                            {showReceipt && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                                        <div className="p-8 text-center bg-emerald-50 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400 opacity-10 rounded-full -mr-16 -mt-16 blur-3xl wave-bg"></div>
                                            <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                                                <CheckCircle className="w-10 h-10" />
                                            </div>
                                            <h4 className="text-2xl font-black text-slate-800 tracking-tight">Venda Sucesso!</h4>
                                            <p className="text-emerald-700 font-bold text-sm mt-1">Recibo gerado para {showReceipt.method.toUpperCase()}</p>
                                        </div>
                                        <div className="p-8 space-y-6">
                                            <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                {showReceipt.items.map((item: any, i: number) => (
                                                    <div key={i} className="flex justify-between items-center text-sm border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                                                        <div>
                                                            <p className="font-bold text-slate-800">{item.item.name}</p>
                                                            <p className="text-[11px] text-slate-400 font-medium">{item.quantity} {item.item.unit} x {formatCurrency(item.item.unitValue)}</p>
                                                        </div>
                                                        <span className="font-black text-slate-700">{formatCurrency(item.quantity * item.item.unitValue)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="pt-4 border-t-2 border-dashed border-slate-100 space-y-2">
                                                <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                                    <span>Valor Final</span>
                                                    <span className="text-2xl font-black text-slate-900">{formatCurrency(showReceipt.total)}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    const printWindow = window.open('', '_blank');
                                                    if (printWindow) {
                                                        const itemsHtml = showReceipt.items.map((i: any) => `
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                          <span>${i.item.name} (${i.quantity}x)</span>
                          <span>${formatCurrency(i.item.unitValue * i.quantity)}</span>
                        </div>
                      `).join('');

                                                        printWindow.document.write(`
                        <html>
                          <head>
                            <title>Recibo ALSF</title>
                            <style>
                              body { font-family: 'Courier New', monospace; width: 80mm; padding: 10px; font-size: 12px; }
                              .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                              .footer { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; text-align: center; font-size: 10px; }
                              .total { font-weight: bold; font-size: 16px; display: flex; justify-content: space-between; margin-top: 10px; }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <strong>LAR SÃO FRANCISCO NA PROVIDÊNCIA DE DEUS</strong><br/>
                              RECIBO DE VENDA PDV<br/>
                              ${new Date().toLocaleString()}
                            </div>
                            ${itemsHtml}
                            <div class="total">
                              <span>TOTAL:</span>
                              <span>${formatCurrency(showReceipt.total)}</span>
                            </div>
                            <div class="footer">
                              Pagamento: ${showReceipt.method.toUpperCase()}<br/>
                              Obrigado por ajudar nossa Missão!
                            </div>
                            <script>
                              window.onload = () => { window.print(); window.close(); };
                            </script>
                          </body>
                        </html>
                      `);
                                                        printWindow.document.close();
                                                    }
                                                }}
                                                className="w-full mb-3 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all border border-slate-200"
                                            >
                                                <Printer className="w-4 h-4" /> IMPRIMIR RECIBO (TÉRMICA)
                                            </button>
                                            <button
                                                onClick={() => setShowReceipt(null)}
                                                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                                            >
                                                FECHAR RECIBO
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
