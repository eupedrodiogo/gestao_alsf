
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
    Mail,
    Lock,
    ArrowRight,
    AlertTriangle,
    ShieldCheck,
    User,
    Fingerprint,
    CheckCircle
} from 'lucide-react';

// --- Biometric Helper Functions ---

function hasBiometricCredential(): boolean {
    return !!localStorage.getItem('bio_credentialId');
}

function storeBiometricData(credentialId: ArrayBuffer, email: string, password: string) {
    const credIdBase64 = btoa(String.fromCharCode(...new Uint8Array(credentialId)));
    localStorage.setItem('bio_credentialId', credIdBase64);
    localStorage.setItem('bio_email', btoa(unescape(encodeURIComponent(email))));
    localStorage.setItem('bio_password', btoa(unescape(encodeURIComponent(password))));
}

function getBiometricData(): { credentialId: Uint8Array; email: string; password: string } | null {
    const credIdBase64 = localStorage.getItem('bio_credentialId');
    const emailBase64 = localStorage.getItem('bio_email');
    const passwordBase64 = localStorage.getItem('bio_password');

    if (!credIdBase64 || !emailBase64 || !passwordBase64) return null;

    const credentialId = Uint8Array.from(atob(credIdBase64), c => c.charCodeAt(0));
    const email = decodeURIComponent(escape(atob(emailBase64)));
    const password = decodeURIComponent(escape(atob(passwordBase64)));

    return { credentialId, email, password };
}

async function registerPasskey(email: string, password: string): Promise<boolean> {
    if (!window.PublicKeyCredential) return false;

    try {
        const userId = new TextEncoder().encode(email);
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const credential = await navigator.credentials.create({
            publicKey: {
                challenge,
                rp: {
                    name: 'Missão Amor é a Cura',
                    id: window.location.hostname
                },
                user: {
                    id: userId,
                    name: email,
                    displayName: email.split('@')[0]
                },
                pubKeyCredParams: [
                    { alg: -7, type: 'public-key' },
                    { alg: -257, type: 'public-key' }
                ],
                authenticatorSelection: {
                    authenticatorAttachment: 'platform',
                    userVerification: 'required',
                    residentKey: 'preferred'
                },
                timeout: 120000,
            }
        });

        if (credential && credential instanceof PublicKeyCredential) {
            storeBiometricData(credential.rawId, email, password);
            return true;
        }
        return false;
    } catch (err) {
        console.error('Erro ao registrar passkey:', err);
        return false;
    }
}

async function authenticateWithPasskey(): Promise<{ email: string; password: string } | null> {
    const bioData = getBiometricData();
    if (!bioData) return null;

    try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const assertion = await navigator.credentials.get({
            publicKey: {
                challenge,
                allowCredentials: [{
                    id: bioData.credentialId,
                    type: 'public-key',
                    transports: ['internal']
                }],
                userVerification: 'required',
                timeout: 60000,
            }
        });

        if (assertion) {
            return { email: bioData.email, password: bioData.password };
        }
        return null;
    } catch (err: any) {
        console.error('Erro na autenticação biométrica:', err);
        if (err?.name === 'NotAllowedError') {
            return null;
        }
        throw err;
    }
}

// --- Login Component ---

export const Login = () => {
    const { login, register } = useAuth();
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricRegistered, setBiometricRegistered] = useState(false);

    // State for the biometric setup prompt (shown BEFORE login)
    const [showBioPrompt, setShowBioPrompt] = useState(false);
    const [pendingLogin, setPendingLogin] = useState<{ email: string; password: string } | null>(null);

    useEffect(() => {
        if (window.PublicKeyCredential) {
            PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
                .then(available => {
                    setBiometricAvailable(available);
                    setBiometricRegistered(available && hasBiometricCredential());
                })
                .catch(() => setBiometricAvailable(false));
        }
    }, []);

    // --- STEP 1: User clicks "Acessar Painel" ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isRegistering) {
            setLoading(true);
            try {
                if (password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');
                await register(name, email, password);
            } catch (err: any) {
                console.error(err);
                let msg = 'Ocorreu um erro. Tente novamente.';
                if (err.code === 'auth/email-already-in-use') msg = 'Este email já está em uso.';
                else if (err.message) msg = err.message;
                setError(msg);
            } finally {
                setLoading(false);
            }
            return;
        }

        // --- Login flow ---
        // If biometric is available but NOT yet registered, show prompt BEFORE logging in
        if (biometricAvailable && !hasBiometricCredential()) {
            setPendingLogin({ email, password });
            setShowBioPrompt(true);
            return; // Stop here, don't login yet
        }

        // Otherwise, login directly
        await doLogin(email, password);
    };

    // --- Actually perform Firebase login ---
    const doLogin = async (loginEmail: string, loginPassword: string) => {
        setLoading(true);
        setError('');
        try {
            await login(loginEmail, loginPassword);
            // If biometric is registered, update stored credentials (in case password changed)
            if (hasBiometricCredential()) {
                localStorage.setItem('bio_email', btoa(unescape(encodeURIComponent(loginEmail))));
                localStorage.setItem('bio_password', btoa(unescape(encodeURIComponent(loginPassword))));
            }
        } catch (err: any) {
            console.error(err);
            let msg = 'Ocorreu um erro. Tente novamente.';
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                msg = 'Email ou senha incorretos.';
            } else if (err.message) {
                msg = err.message;
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // --- STEP 2a: User accepts biometric registration ---
    const handleRegisterBiometric = async () => {
        if (!pendingLogin) return;
        setLoading(true);
        setError('');

        try {
            const success = await registerPasskey(pendingLogin.email, pendingLogin.password);
            if (success) {
                setBiometricRegistered(true);
            }
        } catch (err) {
            console.error('Erro no registro biométrico:', err);
        }

        // After registering (or failing), NOW do the actual Firebase login
        setShowBioPrompt(false);
        await doLogin(pendingLogin.email, pendingLogin.password);
        setPendingLogin(null);
    };

    // --- STEP 2b: User skips biometric registration ---
    const handleSkipBiometric = async () => {
        if (!pendingLogin) return;

        setShowBioPrompt(false);
        await doLogin(pendingLogin.email, pendingLogin.password);
        setPendingLogin(null);
    };

    // --- STEP 3: Biometric login (for returning users) ---
    const handleBiometricLogin = async () => {
        setError('');
        setLoading(true);

        try {
            const credentials = await authenticateWithPasskey();
            if (credentials) {
                await login(credentials.email, credentials.password);
            }
        } catch (err: any) {
            console.error(err);
            let msg = 'Não foi possível autenticar com biometria.';
            if (err?.message) msg = err.message;
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // ===========================================
    // RENDER: Biometric Registration Prompt
    // ===========================================
    if (showBioPrompt) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
                <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-5">
                        <Fingerprint className="w-8 h-8 text-teal-600" />
                    </div>

                    <h2 className="text-xl font-bold text-slate-800 mb-2">
                        Configurar Acesso Biométrico
                    </h2>
                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                        Deseja usar sua <strong>impressão digital</strong> ou <strong>reconhecimento facial</strong> para acessar o painel nas próximas vezes?
                    </p>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-100 mb-4">
                            <AlertTriangle className="h-4 w-4 flex-none" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={handleRegisterBiometric}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-lg shadow-teal-200 transition-all"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Registrando...
                                </>
                            ) : (
                                <>
                                    <Fingerprint className="w-4 h-4" />
                                    Sim, configurar agora
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleSkipBiometric}
                            disabled={loading}
                            className="w-full py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                            Agora não, entrar com senha
                        </button>
                    </div>

                    <p className="text-[10px] text-slate-300 mt-6">
                        Seus dados são protegidos pela biometria do seu dispositivo.
                    </p>
                </div>
            </div>
        );
    }

    // ===========================================
    // RENDER: Main Login Screen
    // ===========================================
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <div className="w-full max-w-[900px] bg-white rounded-2xl shadow-2xl overflow-hidden flex min-h-[600px]">

                {/* Left Panel - Dark Teal (Desktop only) */}
                <div className="hidden md:flex w-[380px] flex-none flex-col justify-between p-10 relative overflow-hidden"
                    style={{ background: 'linear-gradient(160deg, #0f4c5c 0%, #0a3d4d 40%, #072f3d 100%)' }}
                >
                    <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-5 bg-white" />
                    <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full opacity-5 bg-white" />

                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-8 border border-white/10">
                            <img src="/logo alsf.webp" alt="Logo" className="w-10 h-10 object-contain" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
                            Missão Amor é a Cura
                        </h1>
                        <p className="text-sm text-teal-200/80 leading-relaxed">
                            Associação Lar São Francisco<br />na Providência de Deus
                        </p>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center flex-none mt-0.5">
                                <ShieldCheck className="w-4 h-4 text-teal-300" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">Acesso Seguro & Auditado</p>
                                <p className="text-xs text-teal-300/70">Ambiente protegido para dados sensíveis.</p>
                            </div>
                        </div>
                        <div className="border-t border-white/10 pt-4">
                            <p className="text-[11px] text-teal-400/50">
                                © 2024 Associação Lar São Francisco. Todos os direitos reservados.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="flex-1 flex flex-col p-8 md:p-10 overflow-y-auto">
                    {/* Mobile logo */}
                    <div className="md:hidden flex items-center gap-3 mb-6">
                        <img src="/logo alsf.webp" alt="Logo" className="w-10 h-10 object-contain" />
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Missão Amor é a Cura</h2>
                            <p className="text-xs text-slate-400">Lar São Francisco</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                            {isRegistering ? 'Criar Conta' : 'Bem-vindo'}
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            {isRegistering ? 'Preencha os dados para se cadastrar.' : 'Insira suas credenciais para acessar o painel.'}
                        </p>
                    </div>

                    {/* Biometric Quick Login (returning users with passkey) */}
                    {!isRegistering && biometricRegistered && (
                        <>
                            <div className="mb-5 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle className="w-4 h-4 text-teal-600" />
                                    <span className="text-xs font-semibold text-teal-700">Biometria Configurada</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleBiometricLogin}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-lg shadow-teal-200 transition-all active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Verificando...
                                        </>
                                    ) : (
                                        <>
                                            <Fingerprint className="w-5 h-5" />
                                            Entrar com Biometria
                                        </>
                                    )}
                                </button>
                                <p className="text-[10px] text-teal-500/70 text-center mt-2">
                                    Toque para usar impressão digital ou reconhecimento facial
                                </p>
                            </div>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="flex-1 h-px bg-slate-200" />
                                <span className="text-xs text-slate-400 font-medium">ou use email e senha</span>
                                <div className="flex-1 h-px bg-slate-200" />
                            </div>
                        </>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5 flex-1">
                        {isRegistering && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nome Completo</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 text-slate-300" />
                                    </div>
                                    <input
                                        type="text"
                                        required={isRegistering}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
                                        placeholder="Seu nome completo"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">E-mail Corporativo</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-slate-300" />
                                </div>
                                <input
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
                                    placeholder="usuario@alsf.org"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Senha</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-slate-300" />
                                </div>
                                <input
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
                                <AlertTriangle className="h-4 w-4 flex-none" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 shadow-lg ${loading
                                ? 'bg-teal-400 cursor-not-allowed shadow-teal-100'
                                : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-teal-200 hover:shadow-teal-300'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    {isRegistering ? 'Cadastrar' : 'Acessar Painel'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegistering(!isRegistering);
                                    setError('');
                                }}
                                className="text-sm text-teal-600 hover:text-teal-800 font-medium transition-colors"
                            >
                                {isRegistering ? 'Já tem uma conta? Faça Login' : 'Primeiro acesso? Cadastre-se'}
                            </button>
                        </div>

                        {/* Hint for new users */}
                        {!isRegistering && biometricAvailable && !biometricRegistered && (
                            <div className="flex items-center justify-center gap-2 mt-2 pt-3 border-t border-slate-100">
                                <Fingerprint className="w-4 h-4 text-slate-400" />
                                <span className="text-[11px] text-slate-400">
                                    Faça login para configurar acesso biométrico
                                </span>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};
