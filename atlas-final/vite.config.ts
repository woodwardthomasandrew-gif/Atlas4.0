import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Atlas 4.0 renderer build config.
// The renderer is a pure React/TS SPA loaded by the Electron main process.
export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "src/app"),
      "@ui": path.resolve(__dirname, "src/ui"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@plugins": path.resolve(__dirname, "src/plugins")
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
