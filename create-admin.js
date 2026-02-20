// Script para criar o primeiro usuário administrador
// Execute: node create-admin.js

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Configuração do Firebase (mesma do firebase.ts)
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
    try {
        const email = "admin@larsaofrancisco.org.br";
        const password = "Admin@2024";
        const name = "Administrador";

        console.log("Criando usuário administrador...");

        // Criar usuário no Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("Usuário criado com UID:", user.uid);

        // Criar documento do usuário no Firestore com role admin
        await setDoc(doc(db, 'users', user.uid), {
            name: name,
            email: email,
            role: 'admin',
            createdAt: new Date()
        });

        console.log("✅ Usuário administrador criado com sucesso!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📧 Email:", email);
        console.log("🔑 Senha:", password);
        console.log("👤 Papel: admin");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("⚠️  IMPORTANTE: Altere a senha após o primeiro login!");

        process.exit(0);
    } catch (error) {
        console.error("❌ Erro ao criar administrador:", error.message);
        process.exit(1);
    }
}

createAdmin();
