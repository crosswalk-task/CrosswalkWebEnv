import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [
    react(),
    dts({
      entryRoot: "src",
      insertTypesEntry: true,
    }),
  ],

  build: {
    lib: {
      entry: resolve(import.meta.dirname, "src/index.tsx"),
      name: "CrosswalkWebEnv",
      formats: ["es", "cjs"],
      fileName: (format) =>
        format === "es"
          ? "index.js"
          : "index.cjs",
    },

    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "styled-components",
        "jszip",
      ],

      output: {
        exports: "named",
      },
    },

    sourcemap: false,
    emptyOutDir: true,
  },
});