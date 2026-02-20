#!/usr/bin/env node
/**
 * sincronizar-pos-missao.js
 * =========================
 * Exporta os dados do emulador (gerados durante a missão offline) e 
 * faz o upload para o Firebase de produção (com internet).
 *
 * Uso (após a missão, com internet):
 *   npm run sincronizar-pos-missao
 *
 * ⚠️  ATENÇÃO: Isso MESCLARÁ os dados do emulador com a produção.
 *    Documentos com mesmo ID serão atualizados (merge).
 *    Documentos novos serão criados.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const COLLECTIONS = [
    'items',
    'missions',
    'attendances',
    'beneficiaries',
    'volunteers',
    'patient_visits',
    'transactions',
    'notifications',
    'users',
];

// --- Lê do emulador ---
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
const emulatorApp = initializeApp({ projectId: 'gestaoalsf' }, 'emulator');
const emulatorDb = getFirestore(emulatorApp);

console.log('🔄 Lendo dados do emulador local...\n');

const allData = {};
for (const collName of COLLECTIONS) {
    const snap = await emulatorDb.collection(collName).get();
    allData[collName] = {};
    snap.forEach(doc => {
        allData[collName][doc.id] = doc.data();
    });
    console.log(`  📦 ${collName}: ${snap.size} documentos`);
}

// --- Salva backup local antes de subir ---
const { writeFileSync } = await import('fs');
const timestamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
const backupPath = resolve(__dirname, `../missao-backup-${timestamp}.json`);
writeFileSync(backupPath, JSON.stringify(allData, null, 2));
console.log(`\n📁 Backup local salvo: missao-backup-${timestamp}.json`);

// --- Sobe para produção ---
delete process.env.FIRESTORE_EMULATOR_HOST;

const SERVICE_ACCOUNT_PATH = resolve(__dirname, '../serviceAccountKey.json');
const { default: serviceAccount } = await import(SERVICE_ACCOUNT_PATH, { assert: { type: 'json' } });

const prodApp = initializeApp({ credential: cert(serviceAccount) }, 'production');
const prodDb = getFirestore(prodApp);

console.log('\n☁️  Subindo dados para o Firebase de produção...\n');

for (const [collName, docs] of Object.entries(allData)) {
    let count = 0;
    const entries = Object.entries(docs);

    for (let i = 0; i < entries.length; i += 500) {
        const batch = prodDb.batch();
        const chunk = entries.slice(i, i + 500);
        for (const [docId, data] of chunk) {
            const ref = prodDb.collection(collName).doc(docId);
            batch.set(ref, data, { merge: true }); // merge preserva campos não tocados
            count++;
        }
        await batch.commit();
    }

    console.log(`  ✅ ${collName}: ${count} documentos sincronizados`);
}

console.log('\n🎉 Sincronização concluída! Dados da missão estão na nuvem.');
process.exit(0);
