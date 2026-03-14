import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ContentProvider } from './context/ContentContext'
import { LanguageProvider } from './context/LanguageContext'
import { ProfileProvider } from './context/ProfileContext'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <LanguageProvider>
      <ProfileProvider>
        <ContentProvider>
          <AuthProvider>
            <ThemeProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </ThemeProvider>
          </AuthProvider>
        </ContentProvider>
      </ProfileProvider>
    </LanguageProvider>
  </StrictMode>
)
