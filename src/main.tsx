import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// Register Service Worker for Mobile Screen Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => {
        console.log('Puja Fund Service Worker registered successfully:', reg.scope);
      })
      .catch(err => {
        console.warn('Service Worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
