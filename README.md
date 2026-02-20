<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1VeRXSGoXHJmphZml-6Gggdq54f12m10W

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Firebase & Firestore Setup

This project is now configured to use Firebase Hosting and Cloud Firestore database instead of local storage.

### 1. Configure Firebase Credentials
Open `firebase.ts` and replace the placeholder configuration with your project's credentials:
1. Go to [Firebase Console](https://console.firebase.google.com/project/gestaoalsf/settings/general)
2. Scroll down to "Your apps"
3. Select the Web app (</>) or "Add app" -> "Web"
4. Copy the `firebaseConfig` object
5. Paste it into `firebase.ts`

### 2. Enable Cloud Firestore
1. Go to "Criação" > "Firestore Database" in the sidebar
2. Click "Criar banco de dados"
3. Choose a location (e.g., `sao-paulo` or `us-central`)
4. Start in **Test mode** (or set up proper security rules later)

### 3. Enable Storage (Para Upload de Notas)
1. Go to "Criação" > "Storage" in the sidebar
2. Click "Get Started"
3. Choose "Start in test mode" (TEMPORARY) or "Production mode"
4. Click "Done" to create the default bucket.

### 4. Deploy
Run the following commands in your terminal:

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (if needed, select Hosting and Firestore)
# Note: firebase.json and .firebaserc are already created for you.

# Build the project
npm run build

# Deploy to Firebase Hosting
firebase deploy
```

The application will be live at `https://gestaoalsf.web.app`.
