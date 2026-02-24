import React, { useState, useEffect } from 'react';
import { X, Save, Edit, ShieldCheck, Mail, Lock, LayoutDashboard, UserCheck, Stethoscope, Heart, DollarSign } from 'lucide-react';
import { UserData, UserRole } from '../../types/index';

interface UserEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    userToEdit: any | null;
    onSave: (id: string, updates: Partial<any>) => Promise<void>;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
    isOpen,
    onClose,
    userToEdit,
    onSave
}) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole>('voluntario');
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // List of all accessible modules
    const ALL_MODULES = [
        { id: 'dashboard', label: 'Visão Geral (Home)', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'reception', label: 'Recepção', icon: <UserCheck className="w-4 h-4" /> },
        { id: 'triage', label: 'Triagem', icon: <Heart className="w-4 h-4" /> },
        { id: 'consultation', label: 'Consultório Médico', icon: <Stethoscope className="w-4 h-4" /> },
        { id: 'pharmacy', label: 'Farmácia', icon: <Stethoscope className="w-4 h-4" /> },
        { id: 'volunteers', label: 'Voluntários', icon: <Heart className="w-4 h-4" /> },
        { id: 'events', label: 'Eventos', icon: <ShieldCheck className="w-4 h-4" /> },
        { id: 'beneficiaries', label: 'Cadastro Geral', icon: <UserCheck className="w-4 h-4" /> },
        { id: 'inventory', label: 'Estoque', icon: <ShieldCheck className="w-4 h-4" /> },
        { id: 'financial', label: 'Financeiro', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'approvals', label: 'Aprovações', icon: <ShieldCheck className="w-4 h-4" /> },
        { id: 'fundraising', label: 'Arrecadação', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'pos', label: 'PDV', icon: <ShieldCheck className="w-4 h-4" /> },
        { id: 'calendar', label: 'Agenda', icon: <ShieldCheck className="w-4 h-4" /> },
        { id: 'notifications', label: 'Alertas / Logs', icon: <ShieldCheck className="w-4 h-4" /> },
        { id: 'users', label: 'Gestão de Usuários', icon: <ShieldCheck className="w-4 h-4" /> }
    ];

    const DEFAULT_ROLE_TABS: Record<string, string[]> = {
        admin: ['dashboard', 'reception', 'triage', 'consultation', 'pharmacy', 'volunteers', 'events', 'beneficiaries', 'inventory', 'financial', 'approvals', 'fundraising', 'pos', 'calendar', 'notifications', 'users'],
        operador: ['dashboard', 'reception', 'triage', 'consultation', 'pharmacy', 'volunteers', 'events', 'beneficiaries', 'inventory', 'financial', 'approvals', 'fundraising', 'pos', 'calendar', 'notifications'],
        recepcao: ['reception'],
        triagem: ['triage'],
        medico: ['consultation'],
        farmacia: ['pharmacy'],
        enfermeiro: ['triage', 'consultation'],
        dentista: ['consultation'],
        fisioterapeuta: ['consultation'],
        psicologo: ['consultation'],
        voluntario: ['volunteers'],
        estoque: ['inventory'],
        financeiro: ['financial', 'fundraising'],
        arrecadacao: ['fundraising'],
    };

    useEffect(() => {
        if (userToEdit) {
            setName(userToEdit.name || '');
            setEmail(userToEdit.email || '');
            setRole(userToEdit.role || 'voluntario');

            // If user has specific overrides, load them. Else load default mapping.
            if (userToEdit.allowedModules && userToEdit.allowedModules.length > 0) {
                setSelectedModules(userToEdit.allowedModules);
            } else {
                setSelectedModules(DEFAULT_ROLE_TABS[userToEdit.role || 'voluntario'] || ['dashboard']);
            }
        }
    }, [userToEdit]);

    const handleRoleChange = (newRole: UserRole) => {
        setRole(newRole);
        // Automatically reset module permissions to the new role's default
        if (DEFAULT_ROLE_TABS[newRole]) {
            setSelectedModules(DEFAULT_ROLE_TABS[newRole]);
        }
    };

    const toggleModule = (moduleId: string) => {
        if (selectedModules.includes(moduleId)) {
            setSelectedModules(selectedModules.filter(id => id !== moduleId));
        } else {
            setSelectedModules([...selectedModules, moduleId]);
        }
    };

    const handleSave = async () => {
        if (!userToEdit) return;
        setIsSaving(true);
        try {
            await onSave(userToEdit.id, {
                name,
                email, // Saves in DB, but doesn't change actual login email. Emphasized below.
                role,
                allowedModules: selectedModules
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !userToEdit) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <Edit className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Editar Usuário</h2>
                            <p className="text-sm text-slate-500">Altere permissões e detalhes de acesso.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome Completo</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Função Principal</label>
                            <select
                                value={role}
                                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="voluntario">Voluntário</option>
                                <option value="operador">Operador/Recepção</option>
                                <option value="recepcao">Recepção</option>
                                <option value="triagem">Triagem</option>
                                <option value="medico">Médico Clínico</option>
                                <option value="farmacia">Farmácia</option>
                                <option value="enfermeiro">Enfermagem</option>
                                <option value="dentista">Odontologia</option>
                                <option value="fisioterapeuta">Fisioterapia</option>
                                <option value="psicologo">Psicologia</option>
                                <option value="financeiro">Financeiro</option>
                                <option value="arrecadacao">Arrecadação</option>
                                <option value="pdv">PDV (Lojinha)</option>
                                <option value="estoque">Estoque</option>
                                <option value="admin">Administrador Geral</option>
                            </select>
                        </div>
                    </div>

                    {/* Sensitive Data Info Layer */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-2">
                            <Lock className="w-4 h-4" /> Dados Sensíveis de Acesso
                        </h4>
                        <p className="text-xs text-amber-700/80 mb-3">
                            O e-mail e função abaixo são atualizados no painel para consulta. Para <strong>Alterar a Senha de Login</strong> (ou o e-mail real de login do Google), o usuário precisará solicitar a Recuperação de Senha na tela inicial por questões de criptografia, ou o Administrador pode forçar o reenvio clicando abaixo.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    alert('Link de redefinição de senha deve ser enviado pelo Firebase Auth na tela login.');
                                }}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg whitespace-nowrap"
                            >
                                Enviar Link de Senha
                            </button>
                        </div>
                    </div>

                    {/* Modules/Permissions Matrix */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Permissões de Módulos (Páginas)</label>
                            <span className="text-xs text-slate-400">{selectedModules.length} liberados</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {ALL_MODULES.map(module => {
                                const isSelected = selectedModules.includes(module.id);
                                return (
                                    <button
                                        key={module.id}
                                        onClick={() => toggleModule(module.id)}
                                        className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${isSelected
                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                                                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                                            }`}>
                                            {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        <span className={`text-xs font-medium truncate ${isSelected ? 'font-bold' : ''}`}>{module.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-200 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'Salvando...' : 'Salvar Acessos'}
                    </button>
                </div>
            </div>
        </div>
    );
};
