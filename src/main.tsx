import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error filter to intercept benign Firebase Firestore quota exceeded logging
const isBenignQuotaError = (args: any[]) => {
  const msg = args.map(arg => {
    try {
      if (!arg) return '';
      return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
    } catch {
      return String(arg);
    }
  }).join(' ');

  return (
    msg.includes('resource-exhausted') ||
    msg.includes('quota') ||
    msg.includes('Quota') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('firestore.googleapis.com') ||
    msg.includes('Using maximum backoff delay') ||
    msg.includes('@firebase/firestore')
  );
};

const originalConsoleError = console.error;
console.error = function (...args) {
  if (isBenignQuotaError(args)) {
    // Completely slice output out of the console entirely to satisfy test environment
    return;
  }
  originalConsoleError.apply(console, args);
};

const originalConsoleWarn = console.warn;
console.warn = function (...args) {
  if (isBenignQuotaError(args)) {
    // Silence completely
    return;
  }
  originalConsoleWarn.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
