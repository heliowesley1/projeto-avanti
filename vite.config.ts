import type { UserConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  let build: UserConfig['build'], esbuild: UserConfig['esbuild'], define: UserConfig['define']

  if (mode === 'development') {
    build = {
      minify: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    }

    esbuild = {
      jsxDev: true,
      keepNames: true,
      minifyIdentifiers: false,
    }

    define = {
      'process.env.NODE_ENV': '"development"',
      '__DEV__': 'true',
    }
  }

  return {
    plugins: [react()],
    build,
    esbuild,
    define,
    resolve: {
      alias: {
        '@': '/src',
      }
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    // --- CORREÇÃO DO CORS: CONFIGURAÇÃO DE PROXY ---
    server: { 
      proxy: {
        // Redireciona qualquer requisição que comece com /api para o backend
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true, // Necessário para evitar problemas de CORS
          // O reescreve faz com que '/api/livros' se torne 'http://localhost:3000/api/livros'
          rewrite: (path) => path.replace(/^\/api/, '/api'), 
        }
      }
    }
    // ------------------------------------------------
  }
})