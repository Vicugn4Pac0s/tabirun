import { env } from "~/env";
import { t, createTRPCMiddleware } from "./trpc";

/**
 * procedureの実行時間を開発環境だけで記録する。
 * tRPCの開発設定が有効な場合は、実行前に100〜499msの遅延を加える。
 */
export const timingMiddleware = createTRPCMiddleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  if (env.NODE_ENV === "development") {
    const end = Date.now();
    console.log(`[TRPC] ${path} took ${end - start}ms to execute`);
  }

  return result;
});
