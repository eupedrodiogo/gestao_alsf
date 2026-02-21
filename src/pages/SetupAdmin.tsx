import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../api/firebase';

const SetupAdmin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [mode, setMode] = useState<'create' | 'promote'>('create');
    const [createdUserData, setCreatedUserData] = useState<{ email: string; password: string; name: string } | null>(null);

    const handlePromoteExisting = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Fazer login com o usuário existente
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userId = userCredential.user.uid;

            // Verificar se o documento do usuário existe
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                // Atualizar o role para admin
                await updateDoc(userDocRef, {
                    role: 'admin',
                    name: name || userDoc.data().name
                });
            } else {
                // Criar documento se não existir
                await setDoc(userDocRef, {
                    name: name || userCredential.user.displayName || 'Administrador',
                    email,
                    role: 'admin',
                    createdAt: new Date()
                });
            }

            setCreatedUserData({ email, password, name: name || userDoc.data()?.name || 'Administrador' });
            setSuccess(true);
        } catch (err: any) {
            console.error("Erro ao promover usuário:", err);
            if (err.code === 'auth/wrong-password') {
                setError('❌ Senha incorreta. Verifique a senha e tente novamente.');
            } else if (err.code === 'auth/user-not-found') {
                setError('❌ Usuário não encontrado. Use o modo "Criar Novo" para criar um novo administrador.');
            } else {
                setError(`❌ ${err.message || 'Erro ao promover usuário'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Criar usuário no Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });

            // Criar documento no Firestore com role admin
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                name,
                email,
                role: 'admin',
                createdAt: new Date()
            });

            setCreatedUserData({ email, password, name });
            setSuccess(true);
        } catch (err: any) {
            console.error("Erro ao criar admin:", err);
            if (err.code === 'auth/email-already-in-use') {
                setError('⚠️ Este email já está em uso! Use o modo "Promover Existente" e digite sua senha atual para tornar-se admin.');
                setMode('promote');
            } else if (err.code === 'auth/weak-password') {
                setError('❌ Senha muito fraca. Use pelo menos 6 caracteres.');
            } else {
                setError(`❌ ${err.message || 'Erro ao criar administrador'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    if (success && createdUserData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">✅ Administrador {mode === 'create' ? 'Criado' : 'Promovido'}!</h2>
                        <div className="bg-slate-50 p-4 rounded-lg mt-4 text-left">
                            <p className="text-sm text-slate-600 mb-2"><strong>Email:</strong> {createdUserData.email}</p>
                            <p className="text-sm text-slate-600 mb-2"><strong>Nome:</strong> {createdUserData.name}</p>
                            <p className="text-sm text-slate-600"><strong>Papel:</strong> admin (acesso total)</p>
                        </div>
                        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-800">
                                ⚠️ <strong>IMPORTANTE:</strong> {mode === 'promote' ? 'Você agora tem acesso total!' : 'Altere a senha após o primeiro login!'}
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                            Ir para Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">🔧 Setup Admin</h1>
                    <p className="text-slate-600">
                        {mode === 'create' ? 'Criar novo administrador' : 'Promover usuário existente a admin'}
                    </p>
                </div>

                {/* Mode Switcher */}
                <div className="flex gap-2 mb-6">
                    <button
                        type="button"
                        onClick={() => { setMode('create'); setError(null); }}
                        className={`flex-1 py-2 rounded-lg font-medium transition-colors ${mode === 'create'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        ✨ Criar Novo
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode('promote'); setError(null); }}
                        className={`flex-1 py-2 rounded-lg font-medium transition-colors ${mode === 'promote'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        ⬆️ Promover Existente
                    </button>
                </div>

                <form onSubmit={mode === 'create' ? handleCreateAdmin : handlePromoteExisting} className="space-y-4">
                    {mode === 'create' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Nome</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Digite o nome completo"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder={mode === 'create' ? 'admin@example.com' : 'seu@email.com'}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder={mode === 'create' ? 'Mínimo 6 caracteres' : 'Sua senha atual'}
                            required
                            minLength={6}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            {mode === 'create' ? 'Mínimo 6 caracteres' : 'Digite sua senha atual para confirmar'}
                        </p>
                    </div>

                    {mode === 'promote' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Nome (opcional)</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Deixe em branco para manter o atual"
                            />
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading
                            ? '⏳ Processando...'
                            : mode === 'create'
                                ? '✨ Criar Administrador'
                                : '⬆️ Promover a Admin'
                        }
                    </button>
                </form>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                        ℹ️ {mode === 'create'
                            ? 'Esta página cria o primeiro administrador do sistema.'
                            : 'Se você já tem uma conta, use este modo para tornar-se admin.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SetupAdmin;
