import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { NextRequest } from "next/server";
import superjson from "superjson";
import { z } from "zod";

const { fail, auth } = vi.hoisted(() => ({
  fail: vi.fn(),
  auth: vi.fn(),
}));

vi.mock("~/env", () => ({
  env: {
    get NODE_ENV() {
      return process.env.NODE_ENV;
    },
  },
}));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/auth", () => ({ auth }));
async function createTestRouter() {
  const { createTRPCRouter, createTRPCProcedure } = await import(
    "~/server/api/trpc"
  );
  return {
    appRouter: createTRPCRouter({
      mutate: createTRPCProcedure
        .input(z.object({ value: z.string().min(1) }))
        .mutation(() => {
          fail();
          return "ok";
        }),
      probe: createTRPCProcedure
        .input(z.object({ value: z.string().min(1) }))
        .query(() => {
          fail();
          return "ok";
        }),
    }),
  };
}

const sensitive = {
  points: [{ lat: 35.123456, lng: 139.123456 }],
  polyline: "private-polyline-fixture",
  token: "private-token-fixture",
  apiKey: "private-api-key-fixture",
};
const detail = JSON.stringify(sensitive);
const errorResponseSchema = z.object({
  error: z.object({
    json: z.object({
      message: z.string(),
      data: z.object({
        code: z.string(),
        httpStatus: z.number(),
        path: z.string(),
        stack: z.string().optional(),
        zodError: z.unknown(),
      }),
    }),
  }),
});

async function request(value = "valid", path = "probe", method = "GET") {
  const { GET, POST } = await import("./route");
  const input = superjson.serialize({ value });
  const url = new URL(`http://localhost/api/trpc/${path}`);
  if (method === "GET") url.searchParams.set("input", JSON.stringify(input));
  const req = new NextRequest(url, {
    method,
    ...(method === "POST"
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }
      : {}),
  });
  return method === "GET" ? GET(req) : POST(req);
}

beforeEach(() => {
  vi.resetModules();
  vi.doMock("~/server/api/root", createTestRouter);
  fail.mockReset();
  auth.mockReset();
  auth.mockResolvedValue(null);
  vi.stubEnv("NODE_ENV", "production");
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("tRPC HTTPエラー処理", () => {
  it("入力検証のBAD_REQUESTだけにzodErrorを返す", async () => {
    const res = await request("");
    expect(res.status).toBe(400);
    const error = errorResponseSchema.parse(await res.json()).error.json;
    expect(error.data.code).toBe("BAD_REQUEST");
    const validation = z
      .object({
        fieldErrors: z.object({ value: z.array(z.string()).min(1) }),
      })
      .parse(error.data.zodError);
    expect(validation.fieldErrors.value).toHaveLength(1);
    expect(fail).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it.each([
    [
      "通常の例外",
      () => {
        throw new Error(detail);
      },
      "Internal error",
    ],
    [
      "内部のZodError",
      () => {
        z.string()
          .refine(() => false, detail)
          .parse("saved DB value");
      },
      "Validation failed",
    ],
    [
      "JSONの解析エラー",
      () => {
        throw new SyntaxError(detail);
      },
      "Invalid JSON",
    ],
    [
      "明示的な内部エラー",
      () => {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: detail });
      },
      "Internal error",
    ],
  ])(
    "本番の%sは詳細を返さず安全な要約をログに残す",
    async (_name, throwError, summary) => {
      fail.mockImplementation(throwError);
      const res = await request();
      expect(res.status).toBe(500);
      const body = await res.text();
      const error = errorResponseSchema.parse(JSON.parse(body)).error.json;
      expect(error.message).toBe(
        "サーバーエラーが発生しました。時間をおいて再度お試しください。",
      );
      expect(error.data).toEqual({
        code: "INTERNAL_SERVER_ERROR",
        httpStatus: 500,
        path: "probe",
        zodError: null,
      });
      expect(console.error).toHaveBeenCalledExactlyOnceWith(
        "tRPC request failed",
        { path: "probe", code: "INTERNAL_SERVER_ERROR", summary },
      );
      for (const value of [
        "35.123456",
        "139.123456",
        sensitive.polyline,
        sensitive.token,
        sensitive.apiKey,
        "saved DB value",
      ]) {
        expect(body).not.toContain(value);
        expect(
          JSON.stringify(vi.mocked(console.error).mock.calls),
        ).not.toContain(value);
      }
    },
  );

  it("開発環境では内部例外のmessageを維持する", async () => {
    vi.stubEnv("NODE_ENV", "development");
    fail.mockImplementation(() => {
      throw new Error("development diagnostic");
    });
    const res = await request();
    const error = errorResponseSchema.parse(await res.json()).error.json;
    expect(error.message).toBe("development diagnostic");
    expect(error.data.stack).toContain("development diagnostic");
    expect(error.data.zodError).toBeNull();
    expect(console.error).toHaveBeenCalledOnce();
  });

  it("開発環境でも内部のZodErrorをzodErrorとして返さない", async () => {
    vi.stubEnv("NODE_ENV", "development");
    fail.mockImplementation(() => {
      z.string().parse(1);
    });
    const res = await request();
    const error = errorResponseSchema.parse(await res.json()).error.json;
    expect(error.data.code).toBe("INTERNAL_SERVER_ERROR");
    expect(error.data.zodError).toBeNull();
  });

  it("内部エラー以外のcodeとmessageは維持する", async () => {
    fail.mockImplementation(() => {
      throw new TRPCError({ code: "NOT_FOUND", message: "対象なし" });
    });
    const res = await request();
    expect(res.status).toBe(404);
    const error = errorResponseSchema.parse(await res.json()).error.json;
    expect(error.message).toBe("対象なし");
    expect(error.data.code).toBe("NOT_FOUND");
    expect(error.data.zodError).toBeNull();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("開発環境でもリクエスト由来の不明なpathをログに残さない", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const res = await request("valid", sensitive.token);
    expect(res.status).toBe(404);
    expect(console.error).toHaveBeenCalledExactlyOnceWith(
      "tRPC request failed",
      {
        path: "<no-path>",
        code: "NOT_FOUND",
        summary: "Request failed",
      },
    );
  });

  it("context生成時の内部エラーも秘匿してログに残す", async () => {
    auth.mockRejectedValue(new Error(detail));
    const res = await request();
    expect(res.status).toBe(500);
    const error = errorResponseSchema.parse(await res.json()).error.json;
    expect(error.message).toBe(
      "サーバーエラーが発生しました。時間をおいて再度お試しください。",
    );
    expect(error.data.zodError).toBeNull();
    expect(console.error).toHaveBeenCalledExactlyOnceWith(
      "tRPC request failed",
      {
        path: "probe",
        code: "INTERNAL_SERVER_ERROR",
        summary: "Internal error",
      },
    );
  });

  it("正常応答を維持する", async () => {
    const res = await request();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ result: { data: { json: "ok" } } });
    expect(console.error).not.toHaveBeenCalled();
  });

  it("POSTの不正入力もBAD_REQUESTにする", async () => {
    const res = await request("", "mutate", "POST");
    expect(res.status).toBe(400);
    const error = errorResponseSchema.parse(await res.json()).error.json;
    expect(error.data.code).toBe("BAD_REQUEST");
  });
});
