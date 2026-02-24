import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const logSystemAction = async (
    user: { uid: string; name?: string; email?: string | null } | null,
    module: string,
    action: string,
    recordId?: string,
    previousData?: any,
    newData?: any
) => {
    if (!user) return; // Cannot log without a user

    try {
        const auditRef = collection(db, 'audit_logs');
        await addDoc(auditRef, {
            userId: user.uid,
            userName: user.name || 'Desconhecido',
            userEmail: user.email || 'N/A',
            module,
            action,
            recordId: recordId || null,
            previousData: previousData ? JSON.stringify(previousData) : null,
            newData: newData ? JSON.stringify(newData) : null,
            timestamp: serverTimestamp(),
            // Optional: capture user agent or IP info if passed from server, but difficult purely client-side without external API.
        });
        console.log(`[Audit] Logged action: ${action} in module ${module}`);
    } catch (e) {
        console.error("Falha ao registrar log de auditoria", e);
    }
};
