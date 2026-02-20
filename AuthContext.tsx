import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { UserData, UserRole } from './types';

interface AuthContextType {
    user: UserData | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    register: (name: string, email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch user role from Firestore
                const userRef = doc(db, 'users', firebaseUser.uid);
                const userSnap = await getDoc(userRef);

                let role: UserRole = 'voluntario';
                let name = firebaseUser.displayName || '';

                if (userSnap.exists()) {
                    const data = userSnap.data();
                    role = data.role as UserRole;
                    name = data.name || name;
                } else {
                    // First time login? Create default doc or just assume volunteer
                    // specific rule: if email is from specific domain or list, make admin?
                    // For now, let's just make the first ever user an admin manually or via console.
                    // Or default everybody to 'voluntario'
                }

                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    role,
                    name
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, pass: string) => {
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const register = async (name: string, email: string, pass: string) => {
        const result = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(result.user, { displayName: name });
        // Create user document with default role
        await setDoc(doc(db, 'users', result.user.uid), {
            name,
            email,
            role: 'voluntario', // Default role
            createdAt: new Date()
        });
    };

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
