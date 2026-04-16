import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Use relative asset paths so the built app works on GitHub Pages project URLs
  // regardless of repo name/casing or branch deployment path.
  base: './'
});
