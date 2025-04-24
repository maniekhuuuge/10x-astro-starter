// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import node from "@astrojs/node";
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    react(),
    sitemap()
  ],
  server: { port: 3000 },
  vite: {
    plugins: [],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  },
  adapter: node({
    mode: "standalone",
  }),
  experimental: { session: true },
});
