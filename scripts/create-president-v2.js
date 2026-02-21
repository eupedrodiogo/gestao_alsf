
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyBaCc9P0cfQtT3Is6Rx1rV8zmk8GQ36ZT4",
    authDomain: "gestaoalsf.firebaseapp.com",
    projectId: "gestaoalsf",
    storageBucket: "gestaoalsf.firebasestorage.app",
    messagingSenderId: "497909788967",
    appId: "1:497909788967:web:44123fc8de7449b8d7b902",
    measurementId: "G-Q743HYY6Q9",
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

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid), {
            name: name,
            email: email,
            role: 'presidente',
            createdAt: new Date()
        });

        console.log("✅ Conta do Presidente criada!");
        console.log("📧 Email: " + email);
        console.log("🔑 Senha: " + password);
        process.exit(0);
    } catch (error) {
        console.error("❌ Erro:", error.message);
        process.exit(1);
    }
}

createPresident();
