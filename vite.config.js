import { copyFile } from "node:fs/promises";
import { defineConfig } from "vite";

const manifestIcons = ["icon-192.png", "icon-512.png"];

export default defineConfig({
  plugins: [
    {
      name: "copy-manifest-icons",
      async writeBundle() {
        await Promise.all(
          manifestIcons.map((filename) => copyFile(filename, `dist/${filename}`)),
        );
      },
    },
  ],
});
