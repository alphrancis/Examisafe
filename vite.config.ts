import { defineConfig, loadEnv } from 'vite'
import fs from 'fs'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

// Runs the Vercel functions in /api during `pnpm dev`, so the site works
// locally the same way it does on Vercel.
function localApi() {
  return {
    name: 'local-vercel-api',
    apply: 'serve' as const,
    configureServer(server: any) {
      Object.assign(process.env, loadEnv('development', process.cwd(), ''))
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = new URL(req.url, 'http://localhost')
        const m = url.pathname.match(/^\/api\/([\w-]+)$/)
        if (!m || m[1].startsWith('_')) return next()
        const file = path.resolve(__dirname, 'api', `${m[1]}.js`)
        if (!fs.existsSync(file)) return next()
        try {
          let raw = ''
          for await (const chunk of req) raw += chunk
          req.query = Object.fromEntries(url.searchParams)
          req.body = raw ? (() => { try { return JSON.parse(raw) } catch { return raw } })() : undefined
          res.status = (c: number) => ((res.statusCode = c), res)
          res.json = (d: unknown) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(d))
            return res
          }
          // api/** isn't watched, so drop cached copies to always run the latest code.
          for (const mod of server.moduleGraph.idToModuleMap.values()) {
            const f = String(mod.file || '').split('\\').join('/')
            if (f.includes('/api/') && !f.includes('/node_modules/')) server.moduleGraph.invalidateModule(mod)
          }
          const mod = await server.ssrLoadModule(file)
          await mod.default(req, res)
        } catch (err) {
          console.error(`[api/${m[1]}]`, err)
          if (!res.headersSent) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Local API error' }))
          }
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [
    localApi(),
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    watch: {
      // Don't watch/scan the serverless functions — they use firebase-admin
      // which is server-only and breaks Vite's browser bundling.
      ignored: ['**/api/**'],
    },
  },
  optimizeDeps: {
    // Never try to pre-bundle the server-only package for the browser.
    exclude: ['firebase-admin'],
  },
})