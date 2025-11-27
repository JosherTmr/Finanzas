import { useState, useEffect, useCallback } from 'react';
import { Transaction, UserConfig, TransactionStatusMap, AppBackupData } from '../types';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/calendar';
const DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
];

// Extend window interface for Google API
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

export const useGoogleCloud = () => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [tokenClient, setTokenClient] = useState<any>(null);

    // 1. Initialize GAPI (Google API Client)
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
            window.gapi.load('client', async () => {
                try {
                    await window.gapi.client.init({
                        apiKey: API_KEY,
                        discoveryDocs: DISCOVERY_DOCS,
                    });
                    setIsInitialized(true);
                } catch (error) {
                    console.error('Error initializing GAPI:', error);
                }
            });
        };
        document.body.appendChild(script);

        // Load Google Identity Services library
        const scriptGIS = document.createElement('script');
        scriptGIS.src = 'https://accounts.google.com/gsi/client';
        scriptGIS.onload = () => {
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (response: any) => {
                    if (response.access_token) {
                        setIsAuthenticated(true);
                    }
                },
            });
            setTokenClient(client);
        };
        document.body.appendChild(scriptGIS);

        return () => {
            // Cleanup scripts on unmount
            const scripts = document.querySelectorAll('script[src*="google"]');
            scripts.forEach(s => s.remove());
        };
    }, []);

    const handleLogin = useCallback(() => {
        if (tokenClient) {
            tokenClient.requestAccessToken();
        }
    }, [tokenClient]);

    // --- DRIVE OPERATIONS ---

    const saveToDrive = useCallback(async (data: AppBackupData) => {
        if (!isAuthenticated || !window.gapi) return;

        try {
            // 1. Search for existing backup file
            const response = await window.gapi.client.drive.files.list({
                spaces: 'appDataFolder',
                q: "name = 'finanzas_backup.json'",
                fields: 'files(id)'
            });

            const fileContent = JSON.stringify(data);
            const file = new Blob([fileContent], { type: 'application/json' });
            const metadata = {
                name: 'finanzas_backup.json',
                mimeType: 'application/json',
                parents: ['appDataFolder']
            };

            if (response.result.files && response.result.files.length > 0) {
                // UPDATE existing file
                const fileId = response.result.files[0].id;
                await updateFileContent(fileId, file);
            } else {
                // CREATE new file
                const accessToken = window.gapi.client.getToken().access_token;
                const form = new FormData();
                form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
                form.append('file', file);

                await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                    method: 'POST',
                    headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
                    body: form
                });
            }
            console.log('✅ Datos guardados en Drive');
        } catch (error) {
            console.error('❌ Error guardando en Drive:', error);
        }
    }, [isAuthenticated]);

    const loadFromDrive = useCallback(async (): Promise<AppBackupData | null> => {
        if (!isAuthenticated || !window.gapi) return null;

        try {
            const response = await window.gapi.client.drive.files.list({
                spaces: 'appDataFolder',
                q: "name = 'finanzas_backup.json'",
                fields: 'files(id)'
            });

            if (response.result.files && response.result.files.length > 0) {
                const fileId = response.result.files[0].id;
                const result = await window.gapi.client.drive.files.get({
                    fileId: fileId,
                    alt: 'media'
                });
                console.log('✅ Datos cargados desde Drive');
                return result.result as AppBackupData;
            }
        } catch (error) {
            console.error('❌ Error cargando de Drive:', error);
        }
        return null;
    }, [isAuthenticated]);

    // --- CALENDAR OPERATIONS ---

    const addToCalendar = useCallback(async (title: string, date: string, amount: number) => {
        if (!isAuthenticated || !window.gapi) return;

        const event = {
            'summary': `💰 Pagar: ${title}`,
            'description': `Recordatorio de pago de Finanzas Pro.\nMonto: $${amount.toLocaleString()}`,
            'start': {
                'date': date, // Format YYYY-MM-DD for all-day event
            },
            'end': {
                'date': date,
            },
            'reminders': {
                'useDefault': false,
                'overrides': [
                    { 'method': 'popup', 'minutes': 24 * 60 }, // 1 day before
                    { 'method': 'popup', 'minutes': 60 } // 1 hour before
                ]
            }
        };

        try {
            await window.gapi.client.calendar.events.insert({
                'calendarId': 'primary',
                'resource': event
            });
            console.log('✅ Recordatorio añadido a Google Calendar');
            alert('✅ Recordatorio añadido a tu calendario');
        } catch (error) {
            console.error('❌ Error creando evento:', error);
            alert('❌ No se pudo crear el recordatorio en el calendario');
        }
    }, [isAuthenticated]);

    return {
        isInitialized,
        isAuthenticated,
        handleLogin,
        saveToDrive,
        loadFromDrive,
        addToCalendar
    };
};

// Helper function to update file content in Drive
async function updateFileContent(fileId: string, file: Blob) {
    const accessToken = window.gapi.client.getToken().access_token;
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: new Headers({
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json'
        }),
        body: file
    });
}
