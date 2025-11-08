import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ConfigPathProvider } from './contexts/ConfigPathContext';
import { LogProvider } from './contexts/LogContext';
import { ThemeProvider } from './contexts/ThemeContext';
import 'antd/dist/reset.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LogProvider>
          <ConfigPathProvider>
            <App />
          </ConfigPathProvider>
        </LogProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
