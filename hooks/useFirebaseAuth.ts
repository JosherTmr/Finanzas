import { useState, useEffect } from 'react';
import {
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    User,
    GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase.config';

// Storage keys
const TOKEN_STORAGE_KEY = 'google_access_token';
const TOKEN_EXPIRY_KEY = 'google_token_expiry';

// Google OAuth tokens typically expire in 1 hour (3600 seconds)
const TOKEN_EXPIRY_DURATION = 3600 * 1000; // 1 hour in milliseconds

interface FirebaseAuthReturn {
    user: User | null;
    loading: boolean;
    accessToken: string | null;
    isTokenValid: boolean;
    tokenExpiresAt: number | null;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    error: string | null;
}

export const useFirebaseAuth = (): FirebaseAuthReturn => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
    const [isTokenValid, setIsTokenValid] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Helper: Clear expired or invalid token from storage
    const clearExpiredToken = () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
        setAccessToken(null);
        setTokenExpiresAt(null);
        setIsTokenValid(false);
        console.log('🧹 Token expirado/inválido eliminado');
    };

    // Helper: Check if token is still valid
    const checkTokenValidity = (expiryTimestamp: number): boolean => {
        const now = Date.now();
        const isValid = now < expiryTimestamp;

        if (!isValid) {
            console.log('⏰ Token expirado:', {
                expiredAt: new Date(expiryTimestamp).toLocaleString(),
                currentTime: new Date(now).toLocaleString()
            });
        }

        return isValid;
    };

    // Listen to auth state changes (enables auto-login on page reload)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                // Try to get the Google Access Token from localStorage
                const storedAccessToken = localStorage.getItem(TOKEN_STORAGE_KEY);
                const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

                if (storedAccessToken && storedExpiry) {
                    const expiryTimestamp = parseInt(storedExpiry, 10);

                    // Validate if token is still valid
                    if (checkTokenValidity(expiryTimestamp)) {
                        setAccessToken(storedAccessToken);
                        setTokenExpiresAt(expiryTimestamp);
                        setIsTokenValid(true);
                        console.log('✅ Token recuperado de localStorage (válido)', {
                            expiresAt: new Date(expiryTimestamp).toLocaleString()
                        });
                    } else {
                        // Token expired, clear it
                        clearExpiredToken();
                        console.log('⚠️ Token expirado. El usuario debe reconectar.');
                    }
                } else {
                    console.log('⚠️ No se encontró access token. El usuario debe hacer login.');
                    setIsTokenValid(false);
                }
            } else {
                // User logged out, clear token
                clearExpiredToken();
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Periodic check for token expiration (every 5 minutes)
    useEffect(() => {
        if (!accessToken || !tokenExpiresAt) return;

        const checkInterval = setInterval(() => {
            if (!checkTokenValidity(tokenExpiresAt)) {
                clearExpiredToken();
                console.log('⚠️ Token expiró durante la sesión');
            }
        }, 5 * 60 * 1000); // Check every 5 minutes

        return () => clearInterval(checkInterval);
    }, [accessToken, tokenExpiresAt]);

    const loginWithGoogle = async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await signInWithPopup(auth, googleProvider);

            // Extract the Google Access Token from the credential
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;

            if (token) {
                const expiryTimestamp = Date.now() + TOKEN_EXPIRY_DURATION;

                setAccessToken(token);
                setTokenExpiresAt(expiryTimestamp);
                setIsTokenValid(true);

                // Store in localStorage for persistence
                localStorage.setItem(TOKEN_STORAGE_KEY, token);
                localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTimestamp.toString());

                console.log('✅ Login exitoso con Firebase + Google OAuth', {
                    expiresAt: new Date(expiryTimestamp).toLocaleString()
                });
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
            clearExpiredToken();
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
        isTokenValid,
        tokenExpiresAt,
        loginWithGoogle,
        logout,
        error
    };
};
