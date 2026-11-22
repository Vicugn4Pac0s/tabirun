import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod";

import { env } from "~/env";
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
 * SuperJSONと共通のエラー形式を設定したtRPCの基盤を作る。
 * 本番の内部エラーはmessageを固定し、それ以外は元のmessageを返す。
 * zodErrorにはBAD_REQUESTかつ原因がZodErrorの場合だけ検証の詳細を含める。
 */
export const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      message:
        env.NODE_ENV === "production" && error.code === "INTERNAL_SERVER_ERROR"
          ? "サーバーエラーが発生しました。時間をおいて再度お試しください。"
          : shape.message,
      data: {
        ...shape.data,
        zodError:
          error.code === "BAD_REQUEST" && error.cause instanceof ZodError
            ? z.flattenError(error.cause)
            : null,
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
 * このアプリのコンテキスト・エラー形式を共有するtRPCルーターを作る。
 * 各操作の認証・クォータ条件は登録するprocedure側で選択する。
 */
export const createTRPCRouter = t.router;

/**
 * このアプリのコンテキストを使うtRPC middlewareを作る。
 * 後続処理へ進む場合はコールバック内でnextを呼ぶ。
 */
export const createTRPCMiddleware = t.middleware;

/** 共通の通信・エラー設定を持つprocedureの基底を返す。認証やクォータの制約は含まない。 */
export const createTRPCProcedure = t.procedure;
