/**
 * Vite v8 compatible config
 * Fokus:
 * - minimal bundle
 * - optional single-file
 */

import { defineConfig, loadEnv, UserConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig(({ mode }): UserConfig => {
    const env = loadEnv(mode, process.cwd(), '')

    const isSingle = env.VITE_SINGLE_FILE === 'true'

    return {
        base: './',
        plugins: [
            ...(isSingle ? [viteSingleFile()] : [])
        ],

        build: {
            target: 'esnext',

            // tercepat + ringan di Vite v8
            minify: 'esbuild',

            // inline semua asset jika single
            assetsInlineLimit: isSingle ? Number.MAX_SAFE_INTEGER : 4096,

            cssCodeSplit: !isSingle,

            modulePreload: {
                polyfill: false // hemat beberapa byte
            },

            rollupOptions: {
                input: {
                    main: 'index.html',
                    bookmarks: 'bookmarks.html'
                },
                output: {
                    // ⚠️ jangan isi manualChunks kalau mau disable
                    ...(isSingle ? {} : {
                        manualChunks: () => null
                    })
                }
            }
        },

        // dev tetap cepat
        esbuild: {
            drop: ['console', 'debugger'] // optional ultra-light
        }
    }
})