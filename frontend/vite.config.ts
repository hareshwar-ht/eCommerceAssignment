import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { UserConfig as ViteUserConfig } from "vite";
import type { InlineConfig as VitestUserConfig } from "vitest/node";

interface UserConfig extends ViteUserConfig {
  test?: VitestUserConfig;
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: [
        "node_modules",
        "src/test",
        "src/components/ui", // shadcn generated
        "dist",
        "*.config.*",
      ],
    },
  },
} as UserConfig);
