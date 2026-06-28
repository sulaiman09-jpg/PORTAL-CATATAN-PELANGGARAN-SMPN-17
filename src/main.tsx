import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

// Intercept and suppress benign Vite HMR WebSocket connection rejections in the sandboxed iframe
if (typeof window !== 'undefined') {
  const isWebsocketError = (msg: string) => {
    return msg.includes('websocket') || msg.includes('WebSocket') || msg.includes('ws://');
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = event.reason ? String(event.reason.message || event.reason) : '';
    if (isWebsocketError(reasonStr)) {
      event.preventDefault();
      // Silently consume or log as debug warning
      console.debug('[HMR Suppressed]:', reasonStr);
    }
  });

  window.addEventListener('error', (event) => {
    const errorMsg = event.message || '';
    if (isWebsocketError(errorMsg)) {
      event.preventDefault();
      console.debug('[HMR Suppressed]:', errorMsg);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

