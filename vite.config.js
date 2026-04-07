import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        services: resolve(root, "services/index.html"),
        about: resolve(root, "about/index.html"),
        cases: resolve(root, "cases/index.html"),
        contact: resolve(root, "contact/index.html")
      }
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.js"
  }
});
