import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import eslint from "vite-plugin-eslint";
import svgr from "vite-plugin-svgr";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@constants": path.resolve(__dirname, "./src/constants.ts"),
      "@core": path.resolve(__dirname, "./src/core"),
      "@css": path.resolve(__dirname, "./src/css"),
    },
  },
  plugins: [react(), eslint(), svgr()],
});
