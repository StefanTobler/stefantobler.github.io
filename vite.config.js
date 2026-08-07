import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const manifestIcons = ["icon-192.png", "icon-512.png"];

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, "index.html"),
        analytics: resolve(import.meta.dirname, "analytics/index.html"),
      },
    },
  },
  plugins: [
    {
      name: "copy-static-data",
      async writeBundle() {
        await mkdir("dist/data", { recursive: true });
        await Promise.all([
          ...manifestIcons.map((filename) => copyFile(filename, `dist/${filename}`)),
          copyFile("data/analytics.json", "dist/data/analytics.json"),
        ]);
      },
    },
  ],
});
