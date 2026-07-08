/// <reference types="vitest/config" />
/// <reference types="vitest" />
import { defineProject } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineProject({
  plugins: [react()],
  test: {
    name: "unit",
    environment: "jsdom",
    setupFiles: ["./test-setup.ts"],
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    globals: true,
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "./src"),
    },
  },
});
