// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';  // ✅ Import do plugin Tailwind v4
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),  // ✅ Plugin do Tailwind (não é mais PostCSS)
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});