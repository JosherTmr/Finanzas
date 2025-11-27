import React, { useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useNavigate } from 'react-router-dom';
import { Cloud, CheckCircle, Shield } from 'lucide-react';

const LoginPage: React.FC = () => {
    const { loginGoogle, isGoogleAuth } = useFinance();
    const navigate = useNavigate();

    useEffect(() => {
        if (isGoogleAuth) {
            navigate('/');
        }
    }, [isGoogleAuth, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                        <Cloud className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Finanzas Pro
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">
                        Sincroniza tus finanzas en la nube y accede desde cualquier lugar.
                    </p>

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
                        onClick={loginGoogle}
                        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                    >
                        <img
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                            alt="Google"
                            className="w-5 h-5"
                        />
                        Continuar con Google
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
