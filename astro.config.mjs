import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  site: 'https://phyton06.github.io',
  base: '/webbys',
  integrations: [preact()],
});
