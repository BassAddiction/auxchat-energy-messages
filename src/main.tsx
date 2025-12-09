import * as React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Автоматически скрываем адресную строку на мобильных
window.addEventListener('load', () => {
  setTimeout(() => {
    window.scrollTo(0, 1);
  }, 100);
});

// Также скрываем при изменении ориентации
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    window.scrollTo(0, 1);
  }, 100);
});

createRoot(document.getElementById("root")!).render(<App />);