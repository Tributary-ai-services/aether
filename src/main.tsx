import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store/index.js'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import { AuditProvider } from './context/AuditContext.jsx'
import { CollaborationProvider } from './context/CollaborationContext.jsx'
import { NavigationProvider } from './context/NavigationContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import App from './App.tsx'
import './index.css'

// Import dev helpers in development mode
if (import.meta.env.VITE_DEV_MODE === 'true') {
  import('./utils/getDevToken.js');
  import('./utils/quickAuth.js');
  import('./utils/fixKeycloakCors.js');
}

// Add console logs to debug
console.log('Main.tsx loading...')

const root = document.getElementById('root')
if (!root) {
  console.error('Root element not found!')
} else {
  console.log('Root element found, rendering app...')
  
  try {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <Provider store={store}>
          <BrowserRouter>
            <AuthProvider>
              <ThemeProvider>
                <NavigationProvider>
                  <NotificationProvider>
                    <AuditProvider>
                      <CollaborationProvider>
                        <App />
                      </CollaborationProvider>
                    </AuditProvider>
                  </NotificationProvider>
                </NavigationProvider>
              </ThemeProvider>
            </AuthProvider>
          </BrowserRouter>
        </Provider>
      </React.StrictMode>,
    )
    console.log('App rendered successfully')
  } catch (error) {
    console.error('Error rendering app:', error)
  }
}