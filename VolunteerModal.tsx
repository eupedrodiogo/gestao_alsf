import React, { useState, useEffect } from 'react';
import { Volunteer } from './types';
import { X, Save, User, Mail, Phone, Calendar, FileText, Briefcase, Stethoscope } from 'lucide-react';

interface VolunteerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (volunteer: Omit<Volunteer, 'id'>) => Promise<void>;
    initialData?: Volunteer | null;
}

export const VolunteerModal: React.FC<VolunteerModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('');
    const [crm, setCrm] = useState('');
    const [availability, setAvailability] = useState('');
    const [active, setActive] = useState(true);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setEmail(initialData.email);
            setPhone(initialData.phone);
            setRole(initialData.role);
            setCrm(initialData.crm || '');
            setAvailability(initialData.availability);
            setActive(initialData.active);
            setNotes(initialData.notes);
        } else {
            resetForm();
        }
    }, [initialData, isOpen]);

    const resetForm = () => {
        setName('');
        setEmail('');
        setPhone('');
        setRole('');
        setCrm('');
        setAvailability('');
        setActive(true);
        setNotes('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                name,
                email,
                phone,
                role,
                crm,
                availability,
                active,
                notes
            });
            onClose();
            resetForm();
        } catch (error) {
            console.error("Error saving volunteer:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {initialData ? 'Editar Voluntário' : 'Novo Voluntário'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {initialData ? 'Atualize os dados do voluntário' : 'Cadastre um novo voluntário na base'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-200 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nome */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <User size={16} className="text-indigo-600" />
                                Nome Completo
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="Ex: João da Silva"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Mail size={16} className="text-indigo-600" />
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="Ex: joao@email.com"
                            />
                        </div>

                        {/* Telefone */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Phone size={16} className="text-indigo-600" />
                                Telefone / WhatsApp
                            </label>
                            <input
                                type="text"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="Ex: (11) 99999-9999"
                            />
                        </div>

                        {/* Função/Especialidade */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Briefcase size={16} className="text-indigo-600" />
                                Função / Especialidade
                            </label>
                            <input
                                type="text"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="Ex: Motorista, Cozinheiro, Psicólogo"
                            />
                        </div>

                        {/* CRM - Condicional para Médicos */}
                        {/* Registro Profissional (CRM/CRF) */}
                        {(role.toLowerCase().includes('médico') || role.toLowerCase().includes('medico') || role.toLowerCase().includes('farmacêutico') || role.toLowerCase().includes('farmaceutico')) && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <Stethoscope size={16} className="text-indigo-600" />
                                    {(role.toLowerCase().includes('médico') || role.toLowerCase().includes('medico')) ? 'CRM' : 'CRF'}
                                </label>
                                <input
                                    type="text"
                                    value={crm}
                                    onChange={(e) => setCrm(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    placeholder={
                                        (role.toLowerCase().includes('médico') || role.toLowerCase().includes('medico'))
                                            ? "Ex: 123456/SP"
                                            : "Ex: 12345/SP"
                                    }
                                />
                            </div>
                        )}

                        {/* Disponibilidade */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Calendar size={16} className="text-indigo-600" />
                                Disponibilidade
                            </label>
                            <input
                                type="text"
                                value={availability}
                                onChange={(e) => setAvailability(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="Ex: Segundas e Quartas à noite, Fins de semana"
                            />
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-slate-700">Status:</label>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setActive(true)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${active ? 'bg-green-100 text-green-700 ring-2 ring-green-500' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                >
                                    Ativo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActive(false)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!active ? 'bg-red-100 text-red-700 ring-2 ring-red-500' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                >
                                    Inativo
                                </button>
                            </div>
                        </div>

                        {/* Notas */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <FileText size={16} className="text-indigo-600" />
                                Observações
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                                placeholder="Informações adicionais..."
                            />
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
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={18} />
                            {loading ? 'Salvando...' : 'Salvar Voluntário'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
