import { routeRouter } from "~/server/api/routers/route";
import { paceRouter } from "./routers/pace";
import { googlemapRouter } from "./routers/googlemap";
import { userRouter } from "./routers/user";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  route: routeRouter,
  pace: paceRouter,
  googlemap: googlemapRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * アプリのAPIをHTTPなしで呼ぶサーバー用callerを作る。
 * コンテキストまたはその生成関数を渡し、各procedureの認証・検証を適用する。
 */
export const createCaller = createCallerFactory(appRouter);
