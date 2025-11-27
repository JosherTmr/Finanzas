import { useState, useEffect } from 'react';
import {
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    User,
    GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase.config';

interface FirebaseAuthReturn {
    user: User | null;
    loading: boolean;
    accessToken: string | null;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    error: string | null;
}

export const useFirebaseAuth = (): FirebaseAuthReturn => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Listen to auth state changes (enables auto-login on page reload)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                // Try to get the Google Access Token from session storage
                // (it was stored during the initial login)
                const storedAccessToken = sessionStorage.getItem('google_access_token');
                if (storedAccessToken) {
                    setAccessToken(storedAccessToken);
                    console.log('✅ Token recuperado de sessionStorage');
                } else {
                    console.log('⚠️ No se encontró access token. El usuario debe hacer login nuevamente.');
                }
            } else {
                setAccessToken(null);
                sessionStorage.removeItem('google_access_token');
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await signInWithPopup(auth, googleProvider);

            // Extract the Google Access Token from the credential
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;

            if (token) {
                setAccessToken(token);
                // Store in sessionStorage so we can retrieve it on page reload
                sessionStorage.setItem('google_access_token', token);
                console.log('✅ Login exitoso con Firebase + Google OAuth');
            } else {
                throw new Error('No se pudo obtener el access token de Google');
            }
        } catch (err: any) {
            console.error('❌ Error en login:', err);
            setError(err.message || 'Error desconocido al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await signOut(auth);
            setAccessToken(null);
            sessionStorage.removeItem('google_access_token');
            console.log('✅ Sesión cerrada correctamente');
        } catch (err: any) {
            console.error('❌ Error al cerrar sesión:', err);
            setError(err.message || 'Error al cerrar sesión');
        } finally {
            setLoading(false);
        }
    };

    return {
        user,
        loading,
        accessToken,
        loginWithGoogle,
        logout,
        error
    };
};
