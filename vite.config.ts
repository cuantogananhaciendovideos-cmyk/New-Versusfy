import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const firebaseKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_DATABASE_ID'
];

const define = {};
firebaseKeys.forEach(key => {
  define[`process.env.${key}`] = JSON.stringify(process.env[key] || '');
});

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  define
});
