import { TRPCError } from "@trpc/server";
import { timingMiddleware } from "./middleware";
import { createTRPCProcedure } from "./trpc";
import { type QuotaFeature } from "~/server/quota/config";
import { checkQuota } from "~/server/quota/service";

/** 認証を要求せず、実行時間の計測middlewareを適用する。 */
export const publicProcedure = createTRPCProcedure.use(timingMiddleware);

/**
 * ログインを要求し、後続処理へユーザーを含むセッションを渡す。
 * セッションまたはユーザーがなければUNAUTHORIZEDを返す。
 */
export const protectedProcedure = createTRPCProcedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

/**
 * 認証と指定機能のUTC当日の残数確認を行うprocedureを返す。
 * 未ログインはUNAUTHORIZED、上限到達はTOO_MANY_REQUESTS。利用回数の加算は呼出側が行う。
 */
export const quotaProtectedProcedure = (feature: QuotaFeature) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    await checkQuota(ctx.db, ctx.session.user.id, feature);
    return next();
  });
