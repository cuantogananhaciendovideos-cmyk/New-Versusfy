import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log("Versusfy v2.2.0-OMNI: PRODUCTION SYSTEM BOOT [TACTICAL]...");

const rootElement = document.getElementById('versusfy-v161-root');
if (rootElement) {
  // Clear any junk injected by Osano or others
  rootElement.innerHTML = '';
  // Use createRoot for clean client render (avoids hydration mismatches)
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  console.error("CRITICAL: Root element #versusfy-v161-root not found!");
}
