import React, { useState, useMemo } from 'react';
import { ShieldAlert, Search, Filter, Database, Clock, Activity, User, ChevronRight, AlertCircle } from 'lucide-react';
import { useFirestore } from '../../api/useFirestore';
import { AuditLog } from '../../types/index';

export const AuditModule: React.FC = () => {
    const { data: rawLogs, loading } = useFirestore<AuditLog>('audit_logs');

    const [searchTerm, setSearchTerm] = useState('');
    const [filterModule, setFilterModule] = useState<'all' | string>('all');
    const [filterAction, setFilterAction] = useState<'all' | 'CREATE' | 'UPDATE' | 'DELETE'>('all');

    const logs = useMemo(() => {
        let result = [...(rawLogs || [])];

        // Sort descending by date
        result.sort((a, b) => {
            const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : (new Date(a.timestamp)).getTime() || 0;
            const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : (new Date(b.timestamp)).getTime() || 0;
            return timeB - timeA;
        });

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(log =>
                log.userName.toLowerCase().includes(lowerSearch) ||
                log.userEmail.toLowerCase().includes(lowerSearch) ||
                log.recordId?.toLowerCase().includes(lowerSearch)
            );
        }

        if (filterModule !== 'all') {
            result = result.filter(log => log.module === filterModule);
        }

        if (filterAction !== 'all') {
            result = result.filter(log => log.action === filterAction);
        }

        return result;
    }, [rawLogs, searchTerm, filterModule, filterAction]);

    const uniqueModules = useMemo(() => {
        const modules = new Set<string>();
        rawLogs.forEach(l => modules.add(l.module));
        return Array.from(modules).sort();
    }, [rawLogs]);

    const formatTimestamp = (ts: any) => {
        if (!ts) return '--/--/---- --:--';
        if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString('pt-BR');
        return new Date(ts).toLocaleString('pt-BR');
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'text-emerald-600 bg-emerald-100 border-emerald-200';
            case 'UPDATE': return 'text-blue-600 bg-blue-100 border-blue-200';
            case 'DELETE': return 'text-red-600 bg-red-100 border-red-200';
            default: return 'text-slate-600 bg-slate-100 border-slate-200';
        }
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'CREATE': return 'Criação';
            case 'UPDATE': return 'Edição';
            case 'DELETE': return 'Exclusão';
            default: return action;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Buscando rastros e logs do sistema...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Context/Warning Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 flex gap-4">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl h-fit">
                    <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-amber-800 text-sm md:text-base">Audit Trail & Conformidade Sistêmica</h3>
                    <p className="text-amber-700 text-xs md:text-sm mt-1">
                        Estes registros são imutáveis e auditáveis. Tudo o que é salvo, alterado ou excluído nas tabelas críticas (Usuários, Relatórios, Configurações, etc) está criptografado e espelhado aqui para prestação de contas.
                    </p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por usuário, e-mail ou UUID do registro..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        value={filterModule}
                        onChange={(e) => setFilterModule(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none flex-1 md:flex-none"
                    >
                        <option value="all">Todas Coleções</option>
                        {uniqueModules.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>

                    <select
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value as any)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none flex-1 md:flex-none"
                    >
                        <option value="all">Tipos de Ação</option>
                        <option value="CREATE">Somente Criações</option>
                        <option value="UPDATE">Somente Alterações</option>
                        <option value="DELETE">Somente Exclusões</option>
                    </select>
                </div>
            </div>

            {/* Log List */}
            <div className="space-y-4">
                {logs.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
                        <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-700">Nenhum log encontrado</h3>
                        <p className="text-slate-500">A busca ou filtros atuais não retornaram dados de auditoria.</p>
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="bg-white border text-left border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-slate-300 transition-colors group">
                            {/* Header */}
                            <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-y-2 justify-between items-center text-sm">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getActionColor(log.action)}`}>
                                        {getActionLabel(log.action)}
                                    </span>
                                    <span className="font-bold text-slate-700">Tabela: <span className="text-indigo-600 font-mono text-xs p-1 bg-indigo-50 rounded ml-1">{log.module}</span></span>
                                    {log.recordId && <span className="text-slate-400 font-mono text-xs">ID: {log.recordId.substring(0, 8)}...</span>}
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 text-xs">
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatTimestamp(log.timestamp)}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* O QUEM */}
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                        <User className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Autor da Ação</p>
                                        <p className="font-bold text-slate-800 text-sm">{log.userName}</p>
                                        <p className="text-xs text-slate-500">{log.userEmail}</p>
                                        <p className="text-[10px] text-slate-400 font-mono mt-1" title={log.userId}>uid: {log.userId.substring(0, 8)}...</p>
                                    </div>
                                </div>

                                {/* O QUE MUDOU */}
                                <div className="col-span-1 md:col-span-2 bg-slate-50 rounded-lg p-3 border border-slate-100 overflow-x-auto">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detalhes (JSON Diferencial)</p>
                                    <div className="flex flex-col gap-2">
                                        {log.action !== 'CREATE' && log.previousData && (
                                            <div className="relative">
                                                <span className="absolute -left-2 top-0 bottom-0 w-1 bg-red-400 rounded-l" />
                                                <div className="pl-2 line-clamp-2 hover:line-clamp-none transition-all cursor-pointer">
                                                    <span className="text-[10px] text-red-500 font-bold mb-0.5 block">Dados Anteriores:</span>
                                                    <code className="text-xs text-slate-600 break-all bg-white py-1 px-2 rounded border border-slate-200 block whitespace-pre-wrap">{log.previousData}</code>
                                                </div>
                                            </div>
                                        )}
                                        {log.action !== 'DELETE' && log.newData && (
                                            <div className="relative mt-2">
                                                <span className="absolute -left-2 top-0 bottom-0 w-1 bg-emerald-400 rounded-l" />
                                                <div className="pl-2 line-clamp-2 hover:line-clamp-none transition-all cursor-pointer">
                                                    <span className="text-[10px] text-emerald-600 font-bold mb-0.5 block">Novos Dados Registrados:</span>
                                                    <code className="text-xs text-slate-600 break-all bg-white py-1 px-2 rounded border border-slate-200 block whitespace-pre-wrap">{log.newData}</code>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {logs.length > 50 && (
                <div className="text-center pt-4">
                    <p className="text-xs text-slate-400 italic">Exibindo os últimos {logs.length} registros no histórico.</p>
                </div>
            )}
        </div>
    );
};
