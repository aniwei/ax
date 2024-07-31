import minimist from 'minimist'
import { defineConfig } from 'vite'

export default defineConfig((config) => {
  const argv = minimist(process.argv.slice(2))

  return {
    plugins: [],
    build: {
      watch: argv.watch ? {
        buildDelay: 500
      } : null,
      lib: {
        entry: './src/index.ts',
        name: 'index',
        fileName: 'index',
        formats: ['es', 'cjs'],
      },
      minify: !argv.watch,
      rollupOptions: {
        external: []
      },
    }
  }
})
