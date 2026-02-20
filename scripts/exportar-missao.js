#!/usr/bin/env node
/**
 * exportar-missao.js
 * ==================
 * Exporta os dados de PRODUÇÃO do Firebase para um arquivo JSON local.
 *
 * Uso (com internet, ANTES da missão):
 *   npm run exportar-missao
 *
 * O arquivo gerado: missao-backup-<data>.json
 * Esse arquivo depois pode ser importado no emulador local com:
 *   npm run importar-para-emulador
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------
// CONFIGURAÇÃO — ajuste o caminho da service account se necessário
// ---------------------------------------------------------------
const SERVICE_ACCOUNT_PATH = resolve(__dirname, '../serviceAccountKey.json');

let serviceAccount;
try {
    const { default: sa } = await import(SERVICE_ACCOUNT_PATH, { assert: { type: 'json' } });
    serviceAccount = sa;
} catch {
    console.error(`
❌ Arquivo serviceAccountKey.json não encontrado em: ${SERVICE_ACCOUNT_PATH}

Como obter:
  1. Acesse: https://console.firebase.google.com/project/gestaoalsf/settings/serviceaccounts/adminsdk
  2. Clique em "Gerar nova chave privada"
  3. Salve o arquivo como: serviceAccountKey.json (na raiz do projeto)
  4. NUNCA commite esse arquivo no Git!
`);
    process.exit(1);
}

// Collections a exportar
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

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

console.log('🔄 Exportando dados de produção...\n');

const backup = {};

for (const collName of COLLECTIONS) {
    const snapshot = await db.collection(collName).get();
    backup[collName] = {};
    snapshot.forEach(doc => {
        backup[collName][doc.id] = doc.data();
    });
    console.log(`  ✅ ${collName}: ${snapshot.size} documentos`);
}

const timestamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
const outputPath = resolve(__dirname, `../missao-backup-${timestamp}.json`);

writeFileSync(outputPath, JSON.stringify(backup, null, 2), 'utf-8');

console.log(`\n📦 Backup salvo em:\n   ${outputPath}`);
console.log('\n🚀 Próximos passos:');
console.log('   1. Inicie o emulador: npx firebase emulators:start');
console.log('   2. Importe os dados:  npm run importar-para-emulador');

process.exit(0);
