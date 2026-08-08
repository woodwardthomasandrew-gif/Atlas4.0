import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "src/app"),
      "@ui": path.resolve(__dirname, "src/ui"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@plugins": path.resolve(__dirname, "src/plugins")
    }
  },
  test: {
    environment: "jsdom",
    globals: true
  }
});
