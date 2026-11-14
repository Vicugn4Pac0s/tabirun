/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { auth } from "~/server/auth";
import { db } from "~/server/db";

/**
 * セッションを取得し、DBとリクエストヘッダーを含むtRPCコンテキストを返す。
 * 未ログインも許容し、認証の強制はprocedure側で行う。
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth();

  return {
    db,
    session,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
export const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * ルーターから、コンテキストを受け取るサーバー内呼び出し用のファクトリーを作る。
 * HTTPを介さず、呼び出すprocedureの認証・入力検証・middlewareを適用する。
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * このアプリのコンテキスト・エラー形式を共有するtRPCルーターを作る。
 * 各操作の認証・クォータ条件は登録するprocedure側で選択する。
 */
export const createTRPCRouter = t.router;

/**
 * このアプリのコンテキストを使うtRPC middlewareを作る。
 * 後続処理へ進む場合はコールバック内でnextを呼ぶ。
 */
export const createTRPCMiddleware = t.middleware;

export const createTRPCProcedure = t.procedure;
