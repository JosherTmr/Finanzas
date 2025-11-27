# Firebase Configuration Instructions

## Required Environment Variables

Add these variables to your `.env` file:

```env
# Existing Google Cloud variables (keep these for API Key)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_API_KEY=your_google_api_key

# New Firebase variables
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

## Firebase Console Setup Steps

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Click on "Add app" → Web (</>) icon
4. Register your app and copy the configuration values to `.env`
5. Enable Authentication:
   - Go to **Build** → **Authentication** → **Get Started**
   - Click **Sign-in method** tab
   - Enable **Google** provider
   - Click on **Google** to configure:
     - In "Web SDK configuration" section, you'll see your Web client ID
     - Expand **Advanced → Additional scopes** (if available in UI)
     - Add these scopes:
       - `https://www.googleapis.com/auth/drive.appdata`
       - `https://www.googleapis.com/auth/calendar`
     - Save

6. Verify in Google Cloud Console:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your Firebase project
   - Go to **APIs & Services** → **Library**
   - Ensure these APIs are enabled:
     - Google Drive API
     - Google Calendar API
   - Go to **APIs & Services** → **OAuth consent screen**
   - Add the scopes if not already added:
     - `.../auth/drive.appdata`
     - `.../auth/calendar`

## Notes

- The `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_API_KEY` are still needed for gapi initialization
- Firebase will handle authentication and provide the access token
- The access token from Firebase will be used with gapi for Drive/Calendar operations
