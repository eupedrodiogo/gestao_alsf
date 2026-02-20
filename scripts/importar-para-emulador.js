#!/usr/bin/env node
/**
 * importar-para-emulador.js
 * =========================
 * Importa os dados do backup JSON para o Firebase Emulator local.
 *
 * Uso (emulador rodando, ANTES da missão):
 *   npm run importar-para-emulador
 *   npm run importar-para-emulador -- missao-backup-2025-03-10-14-30.json
 *
 * Coloca os dados de produção dentro do emulador para a equipe usar offline.
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// --- Detecta o arquivo de backup mais recente ---
let backupFile = process.argv[2];
if (!backupFile) {
    const files = readdirSync(ROOT)
        .filter(f => f.startsWith('missao-backup-') && f.endsWith('.json'))
        .sort()
        .reverse();
    if (files.length === 0) {
        console.error('❌ Nenhum arquivo missao-backup-*.json encontrado. Execute: npm run exportar-missao');
        process.exit(1);
    }
    backupFile = files[0];
    console.log(`📂 Usando backup mais recente: ${backupFile}`);
}

const backupPath = resolve(ROOT, backupFile);
const backup = JSON.parse(readFileSync(backupPath, 'utf-8'));

// --- Conecta ao emulador Firestore local ---
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

const app = initializeApp({ projectId: 'gestaoalsf' });
const db = getFirestore(app);

console.log('\n🔄 Importando dados para o emulador local...\n');

for (const [collName, docs] of Object.entries(backup)) {
    let count = 0;
    const batch = db.batch();

    for (const [docId, data] of Object.entries(docs)) {
        const ref = db.collection(collName).doc(docId);
        batch.set(ref, data);
        count++;

        // Firestore batch limit = 500 operações
        if (count % 500 === 0) {
            await batch.commit();
            console.log(`  ⏳ ${collName}: ${count} documentos importados...`);
        }
    }

    await batch.commit();
    console.log(`  ✅ ${collName}: ${count} documentos`);
}

// --- Cria usuário Admin padrão ---
try {
    const auth = getAuth(app);
    const email = 'admin@admin.com';
    const password = 'admin123456'; // Mínimo 6 chars

    try {
        await auth.createUser({
            uid: 'admin-local',
            email,
            password,
            displayName: 'Admin Local',
            emailVerified: true
        });
        console.log(`\n🔑 Usuário criado: ${email} / ${password}`);
    } catch (e) {
        if (e.code === 'auth/email-already-exists') {
            console.log(`\n🔑 Usuário já existe: ${email} / ${password} (Resetando senha...)`);
            await auth.updateUser('admin-local', { password });
        } else {
            console.warn('⚠️ Erro ao criar usuário admin:', e.message);
        }
    }
} catch (e) {
    console.warn('⚠️ Erro no Auth Emulator (verifique se está rodando na porta 9099):', e.message);
}

console.log('\n🎉 Dados importados com sucesso!');
console.log('   O emulador está pronto para uso offline.\n');
process.exit(0);
