import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { config } from './src/config'

/** Applique le nom de l'app (src/config.ts) au titre HTML et génère le manifest PWA. */
function appConfig(): Plugin {
  const manifest = () =>
    JSON.stringify(
      {
        name: config.nom,
        short_name: config.nom,
        description: config.slogan,
        lang: 'fr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: config.couleurs.calcaire,
        theme_color: config.couleurs.mer,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      null,
      2,
    )
  return {
    name: 'app-config',
    transformIndexHtml: (html) =>
      html
        .replace(/<title>.*<\/title>/, `<title>${config.nom}</title>`)
        .replace(/content="#155E8B"/, `content="${config.couleurs.mer}"`)
        .replace('</head>', `  <meta name="apple-mobile-web-app-title" content="${config.nom}" />\n  </head>`),
    configureServer(server) {
      server.middlewares.use('/manifest.webmanifest', (_req, res) => {
        res.setHeader('Content-Type', 'application/manifest+json')
        res.end(manifest())
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: manifest() })
    },
  }
}

// base './' : le site fonctionne à la racine de public_html comme dans un sous-dossier.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), appConfig()],
  server: { host: true },
  build: { chunkSizeWarningLimit: 800 },
})
