import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// --- API KEY BRIDGE ---
// Vercel/Vite ortamında process.env bazen boş gelebilir.
// Eğer import.meta.env varsa onu window.process.env içine yedekliyoruz.
try {
  // @ts-ignore
  window.process = window.process || {};
  // @ts-ignore
  window.process.env = window.process.env || {};
  
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    window.process.env.API_KEY = import.meta.env.VITE_API_KEY;
    // @ts-ignore
    window.process.env.VITE_API_KEY = import.meta.env.VITE_API_KEY;
  }
} catch (e) {
  console.warn("API Key bridge warning:", e);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);