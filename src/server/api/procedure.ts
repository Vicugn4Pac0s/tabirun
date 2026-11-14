import { TRPCError } from "@trpc/server";
import { timingMiddleware } from "./middleware";
import { createTRPCProcedure } from "./trpc";
import { type QuotaFeature } from "~/server/quota/config";
import { checkQuota } from "~/server/quota/service";

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = createTRPCProcedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = createTRPCProcedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        // infers the `session` as non-nullable
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
