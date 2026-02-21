import { initializeApp } from "firebase/app";
import {
    getFirestore,
    connectFirestoreEmulator,
} from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getOfflineModeConfig } from "./offlineMode";

// Configuração do Firebase (produção)
const firebaseConfig = {
    apiKey: "AIzaSyBaCc9P0cfQtT3Is6Rx1rV8zmk8GQ36ZT4",
    authDomain: "gestaoalsf.firebaseapp.com",
    projectId: "gestaoalsf",
    storageBucket: "gestaoalsf.firebasestorage.app",
    messagingSenderId: "497909788967",
    appId: "1:497909788967:web:44123fc8de7449b8d7b902",
    measurementId: "G-Q743HYY6Q9",
};

let app: any;
let db: any;
let storage: any;
let auth: any;

// Flag para evitar conectar ao emulador mais de uma vez
let emulatorsConnected = false;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);

    // -----------------------------------------------------------------
    // MODO MISSÃO OFFLINE
    // Se o usuário ativou o modo offline (via painel de configuração),
    // conectamos ao Firebase Emulator rodando no laptop local (host WiFi).
    // Isso permite que todos os tablets na mesma rede WiFi se comuniquem
    // sem precisar de internet — ideal para missões em presídios.
    // -----------------------------------------------------------------
    const offlineConfig = getOfflineModeConfig();

    if (offlineConfig.enabled && !emulatorsConnected) {
        const { host, firestorePort, authPort, storagePort } = offlineConfig;

        console.log(
            `🏕️ MODO MISSÃO OFFLINE ATIVO — Conectando ao servidor local: ${host}`
        );

        connectFirestoreEmulator(db, host, firestorePort);
        connectAuthEmulator(auth, `http://${host}:${authPort}`, {
            disableWarnings: true,
        });
        connectStorageEmulator(storage, host, storagePort);

        emulatorsConnected = true;

        console.log(
            `✅ Emuladores conectados: Firestore :${firestorePort} | Auth :${authPort} | Storage :${storagePort}`
        );
    } else {
        console.log("☁️  Modo produção — Firebase conectado à nuvem.");
    }
} catch (error) {
    console.error("Firebase initialization failed:", error);
}

export { db, storage, auth };
