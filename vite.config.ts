import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    target: "ES2022",
  },
  server: {
    port: 3001,
    open: false,
  },
});
