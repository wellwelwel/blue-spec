import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { preact } from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
const devServerUrl = 'http://127.0.0.1:3001';

export default defineConfig({
  root: join(here, 'client'),
  resolve: {
    alias: [{ find: /^@\//, replacement: `${join(here, '..')}/` }],
  },
  plugins: [preact(), tailwindcss()],
  build: {
    outDir: join(here, '..', '..', 'lib', 'dashboard'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '^/api/': devServerUrl,
      '/events': devServerUrl,
    },
  },
});
