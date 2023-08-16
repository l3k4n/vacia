/// <reference types="vitest" />

import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import eslint from "vite-plugin-eslint";
import svgr from "vite-plugin-svgr";

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
  test: {
    dir: "./src/tests",
    setupFiles: ["./src/tests/__setup__/vitest-canvas-mock.ts"],
    globals: true,
    environment: "jsdom",
    server: {
      deps: {
        inline: ["vitest-canvas-mock"],
      },
    },
    environmentOptions: {
      jsdom: {
        resources: "usable",
      },
    },
  },
});
