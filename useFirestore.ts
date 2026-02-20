import { useState, useEffect } from 'react';
import { db } from './firebase';
import {
    collection,
    onSnapshot,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    DocumentData
} from 'firebase/firestore';

export function useFirestore<T extends { id?: string }>(collectionName: string) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, collectionName));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as T[];
            setData(docs);
            setLoading(false);
        }, (err) => {
            console.error(`Erro ao carregar coleção ${collectionName}:`, err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [collectionName]);

    const addItem = async (item: Omit<T, 'id'>) => {
        try {
            const docRef = await addDoc(collection(db, collectionName), item as DocumentData);
            return docRef.id;
        } catch (err: any) {
            console.error(`Erro ao adicionar item em ${collectionName}:`, err);
            setError(err.message);
            throw err;
        }
    };

    const updateItem = async (id: string, updates: Partial<T>) => {
        try {
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, updates as DocumentData);
        } catch (err: any) {
            console.error(`Erro ao atualizar item ${id} em ${collectionName}:`, err);
            setError(err.message);
            throw err;
        }
    };

    const deleteItem = async (id: string) => {
        try {
            const docRef = doc(db, collectionName, id);
            await deleteDoc(docRef);
        } catch (err: any) {
            console.error(`Erro ao deletar item ${id} em ${collectionName}:`, err);
            setError(err.message);
            throw err;
        }
    };

    return { data, loading, error, addItem, updateItem, deleteItem };
}
