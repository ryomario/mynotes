import { defineConfig } from "vite";

export default defineConfig({
  base: './',
  plugins: [],

  build: {
    target: 'esnext',
    minify: 'esbuild',

    modulePreload: {
      polyfill: false
    },

    rollupOptions: {
      input: {
        main: 'index.html',
        bookmarks: 'bookmarks.html'
      },
      output: {
        manualChunks: () => null
      }
    }
  },

  esbuild: {
    drop: ['console', 'debugger']
  }
})