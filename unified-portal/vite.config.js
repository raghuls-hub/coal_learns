import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@candidate": path.resolve(__dirname, "./src/modules/candidate"),
      "@tutor": path.resolve(__dirname, "./src/modules/tutor"),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    // Optimize production build
    minify: "terser",
    sourcemap: false,
    outDir: "dist",
    chunkSizeWarningLimit: 1000,
  },
});
