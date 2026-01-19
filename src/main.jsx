import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import { ModalProvider } from './contexts/ModalContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <ModalProvider>
                <App />
            </ModalProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)
