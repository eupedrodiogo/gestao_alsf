/**
 * offlineMode.ts
 * Utilitário para gerenciar o Modo Missão Offline.
 *
 * O "Modo Missão" aponta o app para um Firebase Emulator rodando localmente
 * no laptop do coordenador (que cria um hotspot WiFi dentro do presídio).
 * Sem internet necessária.
 */

const STORAGE_KEY = 'missionOfflineConfig';

export interface OfflineModeConfig {
    /** Modo ativo? */
    enabled: boolean;
    /** IP local do laptop servidor (ex: 192.168.137.1) */
    host: string;
    /** Porta do emulador Firestore (padrão: 8080) */
    firestorePort: number;
    /** Porta do emulador Auth (padrão: 9099) */
    authPort: number;
    /** Porta do emulador Storage (padrão: 9199) */
    storagePort: number;
}

export const DEFAULT_CONFIG: OfflineModeConfig = {
    enabled: false,
    host: '192.168.137.1',       // IP padrão do hotspot nativo do Windows
    firestorePort: 8080,
    authPort: 9099,
    storagePort: 9199,
};

export function getOfflineModeConfig(): OfflineModeConfig {
    try {
        // CRITICAL FIX: If on HTTPS (Production/PWA), force DISABLE offline mode to prevent 
        // Mixed Content errors (trying to connect to http://localhost from https://app).
        // The user must be redirected to http://<IP>:5000 to use Mission Mode.
        if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
            return {
                ...DEFAULT_CONFIG,
                enabled: false
            };
        }

        // 1. Tenta ler do localStorage (configuração manual explícita)
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            return {
                ...DEFAULT_CONFIG,
                ...JSON.parse(raw)
            };
        }

        // 2. AUTO-DETECÇÃO: Se estiver rodando via IP local (http://192.168.x.x), 
        // assume que estamos no Modo Missão e conecta ao próprio host.
        // Isso evita erros de Mixed Content (HTTPS -> HTTP) e configura
        // automaticamente os tablets que acessam via IP do laptop.
        if (typeof window !== 'undefined') {
            const isLocalIP = window.location.hostname.match(/^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[0-1])\./);
            const isHttp = window.location.protocol === 'http:';

            if (isLocalIP && isHttp) {
                return {
                    ...DEFAULT_CONFIG,
                    enabled: true,
                    host: window.location.hostname
                };
            }
        }

        return { ...DEFAULT_CONFIG };
    } catch {
        return { ...DEFAULT_CONFIG };
    }
}

export function saveOfflineModeConfig(config: OfflineModeConfig): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function isOfflineModeEnabled(): boolean {
    return getOfflineModeConfig().enabled;
}
