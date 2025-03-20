import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      host: "::",
      // Use a different port than the backend to avoid conflicts
      port: parseInt(env.VITE_PORT || "3001"),
      // In development, proxy API requests to backend
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        }
      }
    },
    // Base path for assets in production
    base: mode === 'production' ? '/' : '/',
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: 'dist',
      // Generate source maps for easier debugging in production
      sourcemap: true,
      // Optimize chunk sizes for better performance
      chunkSizeWarningLimit: 1000,
    }
  }
});
