import type { APIRoute } from 'astro';

const base = `${import.meta.env.BASE_URL.replace(/\/+$/, '')}/`;
const sitePath = (path: string) => `${base}${path.replace(/^\/+/, '')}`;

export const GET: APIRoute = () => new Response(JSON.stringify({
  id: base,
  name: 'Webbys · Administración de barbería',
  short_name: 'Webbys',
  description: 'Panel de demostración para administrar la barbería Webbys.',
  start_url: sitePath('/login/'),
  scope: base,
  display: 'standalone',
  background_color: '#101113',
  theme_color: '#101113',
  icons: [
    { src: sitePath('/icons/webbys-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: sitePath('/icons/webbys-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: sitePath('/icons/webbys-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}), { headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' } });
