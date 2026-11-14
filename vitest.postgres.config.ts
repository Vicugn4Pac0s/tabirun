import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// 専用コンテナだけに接続し、アプリの.envや既存DBは使用しない。
// docker run --rm -p 127.0.0.1:55466:5432 -e POSTGRES_USER=tabirun -e POSTGRES_PASSWORD=tabirun -e POSTGRES_DB=tabirun_quota_test postgres:16
// npm exec vitest -- run --config vitest.postgres.config.ts
export default defineConfig({
  test: {
    include: ["src/server/quota/service.postgres.test.ts"],
    environment: "node",
    provide: {
      quotaPostgresUrl:
        "postgresql://tabirun:tabirun@127.0.0.1:55466/tabirun_quota_test",
    },
  },
  resolve: {
    alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
