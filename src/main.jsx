import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LanguageProvider } from './context/LanguageContext';
import { ProfileProvider } from './context/ProfileContext';
import { ContentProvider } from './context/ContentContext';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <ProfileProvider>
        <ContentProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ContentProvider>
      </ProfileProvider>
    </LanguageProvider>
  </StrictMode>
);
