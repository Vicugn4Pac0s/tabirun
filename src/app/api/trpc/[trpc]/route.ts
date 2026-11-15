import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";
import { ZodError } from "zod";

import { env } from "~/env";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

/**
 * GET・POSTのtRPCリクエストを処理し、リクエストヘッダーからコンテキストを作る。
 * 内部エラーは本番でも、入力や認証情報を含まない要約で記録する。
 */
const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError: ({ path, error }) => {
      if (
        env.NODE_ENV !== "development" &&
        error.code !== "INTERNAL_SERVER_ERROR"
      ) {
        return;
      }
      // pathはリクエスト由来なので、登録済みのprocedure名だけをログに残す。
      const safePath =
        path && Object.hasOwn(appRouter._def.procedures, path)
          ? path
          : "<no-path>";
      // message・stack・cause本体には入力や認証情報が含まれ得る。
      let summary: string;
      if (error.cause instanceof ZodError) {
        summary = "Validation failed";
      } else if (error.cause instanceof SyntaxError) {
        summary = "Invalid JSON";
      } else if (error.code === "INTERNAL_SERVER_ERROR") {
        summary = "Internal error";
      } else {
        summary = "Request failed";
      }
      console.error("tRPC request failed", {
        path: safePath,
        code: error.code,
        summary,
      });
    },
  });

export { handler as GET, handler as POST };
