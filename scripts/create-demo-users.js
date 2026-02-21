import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBaCc9P0cfQtT3Is6Rx1rV8zmk8GQ36ZT4",
    authDomain: "gestaoalsf.firebaseapp.com",
    projectId: "gestaoalsf",
    storageBucket: "gestaoalsf.firebasestorage.app",
    messagingSenderId: "497909788967",
    appId: "1:497909788967:web:44123fc8de7449b8d7b902",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const demoUsers = [
    { email: 'frei.francisco@larsaofrancisco.org.br', password: 'Presidente@2026', role: 'presidente', name: 'Presidente Frei Francisco' },
    { email: 'admin@alsf.org', password: '123456', role: 'admin', name: 'Administrador ALSF' },
    { email: 'saude@alsf.org', password: '123456', role: 'saude', name: 'Médico ALSF' },
    { email: 'farmacia@alsf.org', password: '123456', role: 'farmacia', name: 'Farmácia ALSF' },
    { email: 'financeiro@alsf.org', password: '123456', role: 'financeiro', name: 'Financeiro ALSF' },
    { email: 'arrecadacao@alsf.org', password: '123456', role: 'arrecadacao', name: 'Arrecadação ALSF' },
    { email: 'usuario@alsf.org', password: '123456', role: 'operador', name: 'Operador ALSF' }
];

async function setupDemoUsers() {
    console.log("=== INICIANDO SETUP DE USUÁRIOS DE DEMO ===");
    for (const u of demoUsers) {
        let uid = null;
        try {
            console.log(`\nTentando criar o usuário: ${u.email}...`);
            const userCredential = await createUserWithEmailAndPassword(auth, u.email, u.password);
            uid = userCredential.user.uid;
            console.log(`✅ Usuário criado com sucesso (UID: ${uid}).`);
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                console.log(`ℹ️ Usuário ${u.email} já existe. Tentando fazer login para validar a senha...`);
                try {
                    const loginCred = await signInWithEmailAndPassword(auth, u.email, u.password);
                    uid = loginCred.user.uid;
                    console.log(`✅ Login com a senha configurada no código foi bem-sucedido! O UID é: ${uid}`);
                } catch (loginError) {
                    console.log(`❌ ALERTA: Usuário ${u.email} existe, mas a senha MUDOU ou está errada. Código de erro: ${loginError.code}`);
                    // Se não conseguir logar, não poderei pegar o UID dessa forma sem admin SDK.
                    // Porém, vamos continuar e não atualizar o firestore para esse usuário.
                    continue;
                }
            } else {
                console.error(`❌ Erro inesperado ao tentar criar ${u.email}:`, error);
                continue;
            }
        }

        if (uid) {
            console.log(`Atualizando permissões e perfil no Firestore para UID: ${uid}...`);
            await setDoc(doc(db, 'users', uid), {
                name: u.name,
                email: u.email,
                role: u.role,
                createdAt: new Date()
            }, { merge: true }); // merge true previne perda de outros campos preexistentes
            console.log(`✅ Perfil e permissões (role: ${u.role}) atualizados no Firestore para ${u.email}.`);
        }
    }
    console.log("\n=== FINALIZADO ===");
    process.exit(0);
}

setupDemoUsers();
