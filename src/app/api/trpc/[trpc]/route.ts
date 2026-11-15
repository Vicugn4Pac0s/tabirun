import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";
import { ZodError } from "zod";

import { env } from "~/env";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

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
      // The request controls path, so only log registered procedure names.
      const safePath =
        path && Object.hasOwn(appRouter._def.procedures, path)
          ? path
          : "<no-path>";
      // Raw messages, stacks and causes may contain input or credentials.
      const summary =
        error.cause instanceof ZodError
          ? "Validation failed"
          : error.cause instanceof SyntaxError
            ? "Invalid JSON"
            : error.code === "INTERNAL_SERVER_ERROR"
              ? "Internal error"
              : "Request failed";
      console.error("tRPC request failed", {
        path: safePath,
        code: error.code,
        summary,
      });
    },
  });

export { handler as GET, handler as POST };
