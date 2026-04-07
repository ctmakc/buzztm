import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const root = fileURLToPath(new URL(".", import.meta.url));

function collectHtmlInputs(dir, entries = {}) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.name === "dist" || item.name === "node_modules" || item.name === "public" || item.name.startsWith(".")) {
      continue;
    }

    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      collectHtmlInputs(fullPath, entries);
      continue;
    }

    if (!item.isFile() || item.name !== "index.html") continue;

    const relPath = path.relative(root, fullPath);
    const key =
      relPath === "index.html"
        ? "main"
        : relPath.replace(/\/index\.html$/, "").replace(/[\\/]/g, "-");
    entries[key] = fullPath;
  }

  return entries;
}

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: collectHtmlInputs(root)
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.js"
  }
});
