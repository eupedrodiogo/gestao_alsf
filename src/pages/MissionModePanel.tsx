/**
 * MissionModePanel.tsx
 *
 * Painel de Modo Missão Offline — totalmente automático.
 *
 * TABLET / CELULAR: abre → varre a rede → botão único "Conectar"
 * LAPTOP: instruções simples (duplo-clique no .bat)
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    X,
    Wifi,
    WifiOff,
    Radio,
    Laptop,
    Smartphone,
    CheckCircle,
    AlertTriangle,
    RefreshCw,
    Shield,
    PowerOff,
    ChevronRight,
    Signal,
    Server,
    CloudUpload,
    Boxes,
    Cloud,
    ArrowRight,
    Play,
    HelpCircle,
    Eye,
    EyeOff,
    RotateCcw,
    Check,
    Copy,
} from 'lucide-react';
import {
    getOfflineModeConfig,
    saveOfflineModeConfig,
    DEFAULT_CONFIG,
    type OfflineModeConfig,
} from '../hooks/offlineMode';

interface Props {
    onClose: () => void;
}

// IPs candidatos para varredura (hotspot Windows, Android, iOS, roteadores comuns)
const CANDIDATE_IPS = [
    '192.168.137.1',   // Hotspot Windows (padrão)
    '192.168.43.1',    // Hotspot Android
    '172.20.10.1',     // Hotspot iPhone
    '10.0.0.1',        // Roteador comum
    '192.168.1.1',     // Roteador comum
];
const EMULATOR_PORT = 8080;
const SCAN_TIMEOUT_MS = 3000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
    const [ok, setOk] = useState(false);
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(text).catch(() => { }); setOk(true); setTimeout(() => setOk(false), 2000); }}
            className="ml-2 p-1 rounded hover:bg-white/20 transition-colors shrink-0"
            title="Copiar"
        >
            {ok ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5 text-white/50" />}
        </button>
    );
}

// ─── Varredura de rede ────────────────────────────────────────────────────────

async function scanForServer(customHost?: string): Promise<string | null> {
    const candidates = customHost ? [customHost, ...CANDIDATE_IPS] : CANDIDATE_IPS;
    for (const ip of candidates) {
        try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), SCAN_TIMEOUT_MS);
            await fetch(`http://${ip}:${EMULATOR_PORT}`, { signal: ctrl.signal, mode: 'no-cors' });
            clearTimeout(timer);
            return ip;
        } catch (e: any) {
            if (e?.name !== 'AbortError') {
                // Resposta opaque = servidor respondeu!
                return ip;
            }
        }
    }
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODO TABLET: fluxo automático
// ─────────────────────────────────────────────────────────────────────────────

type ScanStatus = 'scanning' | 'found' | 'notfound' | 'active';

function TabletFlow({ onClose, onSwitchToLaptop }: { onClose: () => void; onSwitchToLaptop: () => void }) {
    const config = getOfflineModeConfig();
    const alreadyActive = config.enabled;

    const [status, setStatus] = useState<ScanStatus>(alreadyActive ? 'active' : 'scanning');
    const [foundIp, setFoundIp] = useState<string | null>(alreadyActive ? config.host : null);
    const [activating, setActivating] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [manualIp, setManualIp] = useState(config.host);
    const scanCountRef = useRef(0);

    const doScan = useCallback(async (custom?: string) => {
        setStatus('scanning');
        const ip = await scanForServer(custom);
        scanCountRef.current += 1;
        if (ip) {
            setFoundIp(ip);
            // Persiste o IP encontrado para próximas vezes
            saveOfflineModeConfig({ ...getOfflineModeConfig(), host: ip });
            setStatus('found');
        } else {
            setStatus('notfound');
        }
    }, []);

    // Inicia varredura automaticamente ao abrir
    useEffect(() => {
        if (!alreadyActive) {
            doScan(config.host !== DEFAULT_CONFIG.host ? config.host : undefined);
        }
    }, []);

    const handleActivate = async () => {
        if (!foundIp) return;
        setActivating(true);
        const cfg: OfflineModeConfig = {
            ...getOfflineModeConfig(),
            host: foundIp,
            enabled: true,
        };
        saveOfflineModeConfig(cfg); // Salva no domínio atual como backup

        // Se estiver em HTTPS (Produção/PWA), PRECISAMOS redirecionar o navegador
        // para o servidor HTTP local (Laptop).
        // Motivo: PWA/HTTPS banem requisições para HTTP (Mixed Content => Tela Branca).
        if (window.location.protocol === 'https:') {
            // Redireciona para a porta de Hosting do Firebase Emulator (5000)
            setTimeout(() => {
                window.location.href = `http://${foundIp}:5000`;
            }, 500);
            return;
        }

        // Se já estiver em HTTP (Dev ou já redirecionado), apenas recarrega para aplicar configs
        setTimeout(() => window.location.reload(), 400);
    };

    const handleDeactivate = () => {
        saveOfflineModeConfig({ ...getOfflineModeConfig(), enabled: false });
        setTimeout(() => window.location.reload(), 400);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className={`px-6 py-5 flex items-center justify-between ${status === 'active' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-slate-800 to-slate-700'}`}>
                <div className="flex items-center gap-3">
                    {status === 'active'
                        ? <Radio className="w-6 h-6 text-white animate-pulse" />
                        : <Boxes className="w-6 h-6 text-white" />
                    }
                    <div>
                        <h2 className="text-white font-bold text-lg leading-tight">Modo Missão Offline</h2>
                        <p className="text-white/70 text-xs">
                            {status === 'active' ? '🟢 Conectado ao servidor local' : status === 'found' ? `🟡 Servidor encontrado (${foundIp})` : status === 'scanning' ? '🔍 Procurando servidor...' : '🔴 Servidor não encontrado'}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">

                {/* ─── STATUS: ATIVO ─── */}
                {status === 'active' && (
                    <>
                        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 text-center">
                            <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <Radio className="w-8 h-8 text-white animate-pulse" />
                            </div>
                            <p className="font-bold text-amber-800 text-lg">Missão em andamento</p>
                            <p className="text-amber-700 text-sm mt-1">
                                Este dispositivo está conectado ao servidor local do laptop.
                            </p>
                            <div className="mt-3 bg-amber-100 rounded-xl px-4 py-2 inline-flex items-center gap-2">
                                <Server className="w-4 h-4 text-amber-600" />
                                <code className="text-amber-800 font-mono font-bold">{foundIp}</code>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Dicas durante a missão</p>
                            <ul className="space-y-1.5 text-xs text-slate-600">
                                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" /> Mantenha o WiFi "MissaoLSF" conectado</li>
                                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" /> Não feche a janela preta no laptop</li>
                                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" /> Use o app normalmente — os dados são salvos automaticamente</li>
                            </ul>
                        </div>

                        <button
                            onClick={handleDeactivate}
                            className="w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 transition-all shadow-lg"
                        >
                            <PowerOff className="w-5 h-5" />
                            Sair do Modo Missão
                        </button>
                    </>
                )}

                {/* ─── STATUS: VARRENDO ─── */}
                {status === 'scanning' && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-4 border-indigo-100 flex items-center justify-center">
                                <Signal className="w-10 h-10 text-indigo-400" />
                            </div>
                            {/* Ondas de varredura */}
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-300 animate-ping opacity-40" />
                            <div className="absolute -inset-2 rounded-full border-2 border-indigo-200 animate-ping opacity-20" style={{ animationDelay: '0.3s' }} />
                            <div className="absolute -inset-5 rounded-full border-2 border-indigo-100 animate-ping opacity-10" style={{ animationDelay: '0.6s' }} />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-slate-700 text-lg">Procurando o servidor da missão...</p>
                            <p className="text-slate-400 text-sm mt-1">Verificando automaticamente a rede WiFi</p>
                        </div>
                        <div className="flex gap-1.5 mt-2">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}

                {/* ─── STATUS: ENCONTRADO ─── */}
                {status === 'found' && foundIp && (
                    <>
                        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-5 text-center">
                            <div className="w-16 h-16 bg-green-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <CheckCircle className="w-8 h-8 text-white" />
                            </div>
                            <p className="font-bold text-green-800 text-lg">Servidor encontrado!</p>
                            <div className="mt-2 bg-green-100 rounded-xl px-4 py-2 inline-flex items-center gap-2">
                                <Laptop className="w-4 h-4 text-green-600" />
                                <code className="text-green-800 font-mono font-bold">{foundIp}</code>
                            </div>
                            <p className="text-green-600 text-xs mt-2">Tudo pronto. Toque em "Ativar Missão" para começar.</p>
                        </div>

                        <button
                            onClick={handleActivate}
                            disabled={activating}
                            className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-600 transition-all shadow-xl disabled:opacity-70"
                        >
                            {activating
                                ? <><RefreshCw className="w-5 h-5 animate-spin" /> Conectando...</>
                                : <><Shield className="w-6 h-6" /> Ativar Modo Missão</>
                            }
                        </button>
                        <p className="text-xs text-center text-slate-400">O app vai recarregar e conectar ao servidor local.</p>
                    </>
                )}

                {/* ─── STATUS: NÃO ENCONTRADO ─── */}
                {status === 'notfound' && (
                    <>
                        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <WifiOff className="w-8 h-8 text-red-400" />
                            </div>
                            <p className="font-bold text-red-700 text-base">Servidor não encontrado</p>
                            <p className="text-red-500 text-sm mt-1">Verifique se o laptop está ligado e com o servidor rodando.</p>
                        </div>

                        {/* Verificações */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Verifique:</p>
                            {[
                                'Este dispositivo está conectado ao WiFi "MissaoLSF"?',
                                'A janela preta (servidor) está aberta no laptop?',
                                'O laptop rodou o arquivo INICIAR-MISSAO.bat?',
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-amber-700">
                                    <span className="font-bold shrink-0">{i + 1}.</span>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>

                        {/* Botão de nova tentativa */}
                        <button
                            onClick={() => doScan(manualIp !== DEFAULT_CONFIG.host ? manualIp : undefined)}
                            className="w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Tentar Novamente
                        </button>

                        {/* IP manual (avançado) */}
                        <button
                            onClick={() => setShowAdvanced(p => !p)}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mx-auto"
                        >
                            {showAdvanced ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {showAdvanced ? 'Ocultar' : 'Digitar o IP manualmente'}
                        </button>

                        {showAdvanced && (
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-600">IP do laptop na rede WiFi:</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={manualIp}
                                        onChange={e => setManualIp(e.target.value)}
                                        placeholder="192.168.137.1"
                                        className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 text-base font-mono focus:outline-none focus:border-amber-400 transition-colors"
                                    />
                                    <button
                                        onClick={() => doScan(manualIp)}
                                        className="px-4 py-2 bg-slate-700 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
                                    >
                                        Testar
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400">Padrão hotspot Windows: <code>192.168.137.1</code></p>
                            </div>
                        )}
                    </>
                )}

                {/* Link para modo laptop */}
                {status !== 'active' && (
                    <div className="border-t border-slate-100 pt-4">
                        <button
                            onClick={onSwitchToLaptop}
                            className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 rounded-xl p-3.5 transition-colors group"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                                    <Laptop className="w-4 h-4 text-slate-600" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-slate-700">Estou no laptop do coordenador</p>
                                    <p className="text-xs text-slate-400">Ver como preparar o servidor</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODO LAPTOP: instruções para o coordenador
// ─────────────────────────────────────────────────────────────────────────────

type LaptopPhase = 'before' | 'after';

function LaptopFlow({ onBack }: { onBack: () => void }) {
    const [phase, setPhase] = useState<LaptopPhase>('before');

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 flex items-center gap-3">
                <button onClick={onBack} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                    <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center">
                    <Laptop className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 className="text-white font-bold text-base">Modo Laptop (Coordenador)</h2>
                    <p className="text-white/60 text-xs">Instruções para preparar o servidor</p>
                </div>
            </div>

            {/* Abas */}
            <div className="flex border-b border-slate-100">
                <button
                    onClick={() => setPhase('before')}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${phase === 'before' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    🚀 Antes da Missão
                </button>
                <button
                    onClick={() => setPhase('after')}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${phase === 'after' ? 'text-green-600 border-b-2 border-green-500' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    ☁️ Após a Missão
                </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {phase === 'before' && (
                    <>
                        {/* Instrução principal */}
                        <div className="bg-blue-500 rounded-2xl p-5 text-center text-white">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <Play className="w-8 h-8 text-white" />
                            </div>
                            <p className="font-bold text-xl">Duplo clique neste arquivo:</p>
                            <div className="mt-3 bg-white/20 rounded-xl px-4 py-3 font-mono text-lg font-bold tracking-wide">
                                INICIAR-MISSAO.bat
                            </div>
                            <p className="text-blue-100 text-sm mt-3">
                                Ele faz tudo automaticamente: exporta dados, importa e liga o servidor.
                            </p>
                        </div>

                        {/* O que ele faz */}
                        <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">O que o arquivo faz:</p>
                            <div className="space-y-2.5">
                                {[
                                    { icon: <Wifi className="w-4 h-4 text-blue-500" />, label: 'Cria o WiFi "MissaoLSF"', detail: 'Senha: missao2024' },
                                    { icon: <Cloud className="w-4 h-4 text-indigo-500" />, label: 'Baixa dados da nuvem', detail: 'Exporta tudo automaticamente' },
                                    { icon: <Server className="w-4 h-4 text-amber-500" />, label: 'Liga o servidor local', detail: 'Fica rodando durante a missão' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center shrink-0">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                                            <p className="text-xs text-slate-400">{item.detail}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700">
                                <strong>Não feche a janela preta</strong> que aparece no final — ela é o servidor. Pode minimizar, mas não fechar.
                            </p>
                        </div>
                    </>
                )}

                {phase === 'after' && (
                    <>
                        {/* Instrução principal */}
                        <div className="bg-green-600 rounded-2xl p-5 text-center text-white">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <CloudUpload className="w-8 h-8 text-white" />
                            </div>
                            <p className="font-bold text-xl">Duplo clique neste arquivo:</p>
                            <div className="mt-3 bg-white/20 rounded-xl px-4 py-3 font-mono text-lg font-bold tracking-wide">
                                FINALIZAR-MISSAO.bat
                            </div>
                            <p className="text-green-100 text-sm mt-3">
                                Ele envia todos os dados para a nuvem e desliga o servidor.
                            </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Antes de rodar:</p>
                            <div className="space-y-2">
                                {[
                                    'Conecte o laptop ao WiFi normal (com internet)',
                                    'O emulador ainda pode estar rodando — tudo bem',
                                    'Não desligue o laptop antes de terminar',
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export const MissionModePanel: React.FC<Props> = ({ onClose }) => {
    const [mode, setMode] = useState<'tablet' | 'laptop'>('tablet');

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
                style={{ maxHeight: '92vh' }}
            >
                {mode === 'tablet'
                    ? <TabletFlow onClose={onClose} onSwitchToLaptop={() => setMode('laptop')} />
                    : <LaptopFlow onBack={() => setMode('tablet')} />
                }
            </div>
        </div>
    );
};
