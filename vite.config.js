import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { spawn } from 'child_process';

// Automatically starts PHP built-in server on 127.0.0.1:8088 for /api during Vite dev
function phpApiServerPlugin() {
  let phpProcess = null;
  return {
    name: 'php-api-server',
    configureServer() {
      if (!phpProcess) {
        phpProcess = spawn('php', ['-S', '127.0.0.1:8088', '-t', '.'], {
          stdio: 'ignore',
          shell: true,
        });
        process.on('exit', () => {
          if (phpProcess) phpProcess.kill();
        });
      }
    },
    closeBundle() {
      if (phpProcess) {
        phpProcess.kill();
        phpProcess = null;
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), phpApiServerPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8088',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
