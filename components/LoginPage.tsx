import React, { useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useNavigate } from 'react-router-dom';
import { Cloud, CheckCircle, Shield, Loader2, AlertTriangle } from 'lucide-react';

const LoginPage: React.FC = () => {
    const { loginGoogle, isGoogleAuth, isTokenValid, tokenError, authLoading } = useFinance();
    const navigate = useNavigate();

    useEffect(() => {
        // Only navigate to home if user is authenticated AND token is valid
        if (isGoogleAuth && isTokenValid) {
            navigate('/');
        }
    }, [isGoogleAuth, isTokenValid, navigate]);

    const handleLogin = async () => {
        try {
            await loginGoogle();
        } catch (error) {
            console.error('Error en login:', error);
        }
    };

    // Determine if this is a reconnection scenario
    const isReconnection = isGoogleAuth && !isTokenValid;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8 text-center">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isReconnection
                            ? 'bg-amber-100 dark:bg-amber-900/30'
                            : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                        {isReconnection ? (
                            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                        ) : (
                            <Cloud className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        )}
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Finanzas Pro
                    </h1>

                    {isReconnection ? (
                        <>
                            <p className="text-amber-600 dark:text-amber-400 font-medium mb-2">
                                Sesión de Google Drive Expirada
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
                                Tu sesión de Google ha expirado. Por favor, reconéctate para seguir sincronizando tus datos.
                            </p>
                        </>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 mb-8">
                            Sincroniza tus finanzas en la nube y accede desde cualquier lugar.
                        </p>
                    )}

                    {tokenError && (
                        <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                {tokenError}
                            </p>
                        </div>
                    )}

                    <div className="space-y-4 mb-8 text-left">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                <span className="font-semibold text-gray-900 dark:text-white">Respaldo Automático:</span> Tus datos se guardan seguros en tu Google Drive.
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                <span className="font-semibold text-gray-900 dark:text-white">Multi-dispositivo:</span> Accede a tu presupuesto desde tu celular o PC.
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                <span className="font-semibold text-gray-900 dark:text-white">Recordatorios:</span> Agrega pagos a tu Google Calendar.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogin}
                        disabled={authLoading}
                        className={`w-full flex items-center justify-center gap-3 border font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${isReconnection
                                ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white'
                            }`}
                    >
                        {authLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {isReconnection ? 'Reconectando...' : 'Iniciando sesión...'}
                            </>
                        ) : (
                            <>
                                <img
                                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                    alt="Google"
                                    className="w-5 h-5"
                                />
                                {isReconnection ? 'Reconectar con Google' : 'Continuar con Google'}
                            </>
                        )}
                    </button>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 text-center border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Shield className="w-3 h-3" />
                        <span>Tus datos son privados y solo tú tienes acceso a ellos.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
