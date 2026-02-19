import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ProfileProvider } from "./context/ProfileContext";
import './i18n/config' 

createRoot(document.getElementById('root')!).render(
    <ProfileProvider>
      <App />
    </ProfileProvider>
)
