import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/nunito'
import '@fontsource-variable/fredoka'
import './index.css'
import App from './App'
import { config } from './config'

document.title = config.nom

// Applique les couleurs de config.ts aux variables CSS du thème (ex. merClair → --color-mer-clair)
for (const [cle, valeur] of Object.entries(config.couleurs)) {
  const nom = cle.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
  document.documentElement.style.setProperty(`--color-${nom}`, valeur)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
