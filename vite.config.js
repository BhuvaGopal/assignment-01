import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'

/* eslint-disable no-undef */

export const isProduction = process.env.NODE_ENV === 'production'

// Set entry point for index.html, from arguments passed
process.env.PUBLIC_ENTRY_POINT = process.argv[process.argv.length - 1]

const packageAlias = [
  { find: '@', replacement: fileURLToPath(new URL(`src/`, import.meta.url)) },
  { find: 'core', replacement: fileURLToPath(new URL(`fe-zen-arch/core/`, import.meta.url)) },
  { find: 'icons', replacement: fileURLToPath(new URL(`fe-zen-arch/icons/`, import.meta.url)) },
  { find: 'ui', replacement: fileURLToPath(new URL(`fe-zen-arch/ui/`, import.meta.url)) }
]

const port = parseInt(process.argv[process.argv.length - 2])

/** @type {import('vite').UserConfig} */
const config = {
  server: { port: port, strictPort: true },
  plugins: [react()],
  envPrefix: ['VITE_', 'PUBLIC_'],
  resolve: {
    alias: [...packageAlias]
  }
}

if (isProduction) {
  config.publicDir = false

  config.build = {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Check if the import is from not from node_modules, i.e our source code
          if (!id.includes('node_modules')) return null

          const module = id.includes('.pnpm')
            ? id.split('.pnpm/')[1].split('/')[0]
            : id.split('node_modules/')[1].split('/')[0]

          if (module.includes('@tanstack')) return 'v/fetch'
          if (module.includes('react-hook-form')) return 'v/form'
          if (module.includes('@floating-ui') || module.includes('tabbable')) return 'v/popover'
          if (module.includes('sentry')) return 'v/err-obs'
          if (module.includes('chart.js') || module.includes('chartjs')) return 'v/charts'
          if (module.startsWith('react') || module.startsWith('scheduler')) return 'v/react'

          return 'v/others' // All other dependencies
        }
      }
    }
  }
}

export default defineConfig(config)
