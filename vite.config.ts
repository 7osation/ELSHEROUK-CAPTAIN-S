import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    // 'base: "./"' is crucial for hosting on temp domains or subdirectories
    base: './', 
    build: {
      outDir: 'dist',
    },
    define: {
      'process.env': {}, // Empty env definition to prevent crashes if legacy code references it
    }
  };
});