
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
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

async function createPresident() {
    try {
        const email = "frei.francisco@larsaofrancisco.org.br";
        const password = "Presidente@2026";
        const name = "Frei Francisco";

        console.log("Criando conta oficial do Presidente (Frei Francisco)...");

        const userCredential = await createUserWithEmailAndPassword(auth, email, password).catch(async (e) => {
            if (e.code === 'auth/email-already-in-use') {
                console.log("⚠️ Email já existe no Auth. Vou apenas tentar atualizar o Firestore.");
                return null;
            }
            throw e;
        });

        // Se o usuário já existe, não temos o uid do AuthContext aqui facilmente sem buscar ou logar, 
        // mas o script original de admin tentava criar.
        // Vou assumir que se o email existe, o usuário já tem UID.
        // No entanto, para simplificar, se falhar no Auth, vou apenas reportar.

        if (userCredential) {
            const user = userCredential.user;
            await setDoc(doc(db, 'users', user.uid), {
                name: name,
                email: email,
                role: 'presidente',
                createdAt: new Date()
            });
            console.log("✅ Conta do Presidente criada!");
        } else {
            // Se já existe, precisamos do UID para atualizar o role. 
            // Como é um script local, vou sugerir que o usuário use o admin para mudar o role se necessário.
            console.log("ℹ️ Usuário já existente no Auth.");
        }

        console.log("📧 Email: " + email);
        console.log("🔑 Senha: " + password);
        process.exit(0);
    } catch (error) {
        console.error("❌ Erro:", error.message);
        process.exit(1);
    }
}

createPresident();
