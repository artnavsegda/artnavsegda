import { defineConfig, loadEnv } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Два контракта — два хоста. В проде это обычно одна точка входа (nginx/ingress),
  // которая сама разводит /api/v1/* и /api/* по нужным бэкендам; в dev — proxy ниже,
  // если заданы переменные окружения (см. .env.example).
  const proxy: Record<string, { target: string; changeOrigin: boolean }> = {};
  if (env.VITE_AUTH_PROXY_TARGET) {
    proxy['/api/v1'] = { target: env.VITE_AUTH_PROXY_TARGET, changeOrigin: true };
  }
  if (env.VITE_ORDER_PROXY_TARGET) {
    proxy['/api'] = { target: env.VITE_ORDER_PROXY_TARGET, changeOrigin: true };
  }

  return {
    plugins: [tailwindcss(), svelte()],
    server: { proxy }
  };
});
