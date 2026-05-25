import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const storedTheme = localStorage.getItem('fisher_dark_mode');
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
const darkEnabled = storedTheme === 'true' || (storedTheme === null && prefersDark);
document.documentElement.classList.toggle('dark', darkEnabled);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
