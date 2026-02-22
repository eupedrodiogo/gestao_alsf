import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo alsf.webp', 'logo fraternidade alsf.png', 'screenshot-mobile.png', 'screenshot-desktop.png'],
        manifest: {
          name: 'Lar São Francisco na Providência de Deus',
          short_name: 'ALSF Gestão',
          description: 'Sistema oficial de gestão do Lar São Francisco na Providência de Deus. Controle de missões, estoque, financeiro e atendimento clínico.',
          theme_color: '#1a2c27',
          background_color: '#ffffff',
          display: 'standalone',
          categories: ['medical', 'productivity', 'management'],
          icons: [
            {
              src: 'logo fraternidade alsf.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'logo fraternidade alsf.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
          screenshots: [
            {
              src: 'screenshot-mobile.png',
              sizes: '1280x2276',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Painel de Gestão Mobile'
            },
            {
              src: 'screenshot-desktop.png',
              sizes: '2276x1280',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Painel de Gestão Desktop'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
