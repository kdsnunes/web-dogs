import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  outDir: 'dist',
  site: 'https://ninpozankennel.com.br',
  integrations: [sitemap()],
});
