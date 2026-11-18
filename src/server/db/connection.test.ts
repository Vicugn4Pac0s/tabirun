// @vitest-environment node
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const databaseUrl = "postgresql://user:pass@localhost:5432/test";

const postgres = vi.hoisted(() =>
  vi.fn(() => ({
    options: {
      parsers: {},
      serializers: {},
    },
  })),
);

vi.mock("postgres", () => ({ default: postgres }));

const dbDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(dbDir, "../../..");

function isFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}

function resolveLocalModule(
  fromFile: string,
  specifier: string,
): string | null {
  if (!specifier.startsWith(".") && !specifier.startsWith("~/")) return null;

  const base = specifier.startsWith("~/")
    ? resolve(projectRoot, "src", specifier.slice(2))
    : resolve(dirname(fromFile), specifier);
  const extensions = [".ts", ".tsx", ".js", ".mjs", ".cjs"];
  const candidates = [
    base,
    ...extensions.map((extension) => `${base}${extension}`),
    ...extensions.map((extension) => join(base, `index${extension}`)),
  ];
  const found = candidates.find((candidate) => isFile(candidate));
  if (!found) {
    throw new Error(`importを解決できません: ${specifier} (${fromFile})`);
  }
  return found;
}

function localImportSpecifiers(entry: string): {
  files: string[];
  specifiers: string[];
} {
  const importPattern =
    /^\s*(?:import|export)\s+(?:type\s+)?(?:[^'"\n]*?\sfrom\s+)?["']([^"']+)["']/gm;
  const files: string[] = [];
  const specifiers: string[] = [];
  const pending = [entry];
  const seen = new Set<string>();

  while (pending.length > 0) {
    const file = pending.pop();
    if (file === undefined || seen.has(file)) continue;
    seen.add(file);
    files.push(file);

    const source = readFileSync(file, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("//"))
      .join("\n");
    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1];
      if (specifier === undefined) continue;
      specifiers.push(specifier);
      if (specifier === "server-only") continue;
      const resolved = resolveLocalModule(file, specifier);
      if (resolved) pending.push(resolved);
    }
  }

  return { files, specifiers };
}

beforeEach(() => {
  vi.doUnmock("server-only");
  vi.resetModules();
  postgres.mockClear();
  Reflect.deleteProperty(globalThis, "client");
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("SKIP_ENV_VALIDATION", "");
  vi.stubEnv("AUTH_SECRET", "test-auth-secret");
  vi.stubEnv("GOOGLE_CLIENT_ID", "test-client");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-secret");
  vi.stubEnv("DATABASE_URL", databaseUrl);
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAP_API_KEY", "test-public-key");
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAP_ID", "test-map-id");
  vi.stubEnv("NEXT_PRIVATE_GOOGLE_MAP_API_KEY", "test-private-key");
});

afterEach(() => {
  vi.doUnmock("server-only");
  Reflect.deleteProperty(globalThis, "client");
  vi.unstubAllEnvs();
});

describe("DB接続", () => {
  it("prepare: falseで接続し、非本番の再読み込みではクライアントを再利用する", async () => {
    const first = await import("./connection");

    expect(postgres).toHaveBeenCalledTimes(1);
    expect(postgres).toHaveBeenCalledWith(databaseUrl, { prepare: false });

    vi.resetModules();
    const second = await import("./connection");

    expect(postgres).toHaveBeenCalledTimes(1);
    expect(second.client).toBe(first.client);
    expect(second.db).toBeDefined();
  });

  it("本番の再読み込みではクライアントを再利用しない", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const first = await import("./connection");

    expect(postgres).toHaveBeenCalledTimes(1);
    expect(postgres).toHaveBeenCalledWith(databaseUrl, { prepare: false });
    expect(globalThis).not.toHaveProperty("client");

    vi.resetModules();
    const second = await import("./connection");

    expect(postgres).toHaveBeenCalledTimes(2);
    expect(postgres).toHaveBeenNthCalledWith(2, databaseUrl, {
      prepare: false,
    });
    expect(second.client).not.toBe(first.client);
    expect(globalThis).not.toHaveProperty("client");
  });

  it("アプリ入口はconnectionと同じclientとdbを返す", async () => {
    vi.doMock("server-only", () => ({}));
    const connection = await import("./connection");
    const entry = await import("./index");

    expect(entry.client).toBe(connection.client);
    expect(entry.db).toBe(connection.db);
    expect(postgres).toHaveBeenCalledTimes(1);
  });

  it("アプリ入口は通常のNodeから読むとserver-onlyで失敗する", async () => {
    await expect(import("./index")).rejects.toThrow(
      "This module cannot be imported from a Client Component module.",
    );
  });
});

describe("db:seedのimport", () => {
  it("server-onlyとdb/index.tsを通らずconnectionを読む", () => {
    const graph = localImportSpecifiers(resolve(dbDir, "seed.ts"));

    expect(graph.specifiers).toContain("./connection");
    expect(graph.specifiers).not.toContain("server-only");
    expect(
      graph.files.some((file) =>
        file.endsWith(`${sep}server${sep}db${sep}index.ts`),
      ),
    ).toBe(false);
    expect(
      graph.files.some((file) => file.endsWith(`${sep}connection.ts`)),
    ).toBe(true);
  });
});
