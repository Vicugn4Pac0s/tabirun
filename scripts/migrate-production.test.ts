// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readFile: vi.fn(),
  question: vi.fn(),
  close: vi.fn(),
  spawn: vi.fn(),
}));
vi.mock("node:fs/promises", () => ({ readFile: mocks.readFile }));
vi.mock("node:readline/promises", () => ({
  createInterface: () => ({ question: mocks.question, close: mocks.close }),
}));
vi.mock("node:child_process", () => ({ spawn: mocks.spawn }));

const password = "dummy-private-password";
const projectRef = "abcdefghijklmnopqrst";
const databaseUrl = `postgresql://postgres.${projectRef}:${password}@shared-pooler.example.com:5432/postgres`;
let logs: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  logs = vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  mocks.readFile.mockResolvedValue(`DATABASE_URL=${databaseUrl}`);
  mocks.question.mockResolvedValue("");
});
afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

async function runUntilCancelled() {
  await import("./migrate-production");
  await vi.waitFor(() => {
    expect(logs).toHaveBeenCalledWith(
      "キャンセルしました。何も実行していません。",
    );
  });
  return logs.mock.calls.flat().join("\n");
}

describe("本番migrationの確認表示", () => {
  it("専用ファイルから接続先refを表示し、秘密値とユーザー名全体を表示しない", async () => {
    const output = await runUntilCancelled();
    expect(mocks.readFile).toHaveBeenCalledExactlyOnceWith(
      new URL("../.env.db-production.local", import.meta.url),
      "utf8",
    );
    expect(output).toContain(`接続先プロジェクトref: ${projectRef}`);
    expect(output).toContain("shared-pooler.example.com");
    expect(output).not.toContain(databaseUrl);
    expect(output).not.toContain(password);
    expect(output).not.toContain(`postgres.${projectRef}`);
    expect(output).toContain("列の追加などはデプロイ前に適用し");
    expect(output).toContain("破壊的な変更は適用手順とコードとの互換性を確認");
    expect(output).not.toContain("本番デプロイが完了し");
  });

  it.each([
    "postgres",
    "postgres.",
    "unexpected-user",
    "postgres.ref%0Asecret",
  ])(
    "refを判別できないユーザー名は表示せず照合を案内する（%s）",
    async (username) => {
      mocks.readFile.mockResolvedValue(
        `DATABASE_URL=postgresql://${username}:${password}@shared-pooler.example.com/postgres`,
      );
      const output = await runUntilCancelled();
      expect(output).toContain("接続先プロジェクトref: 判別できません。");
      expect(output).toContain("管理画面と照合してください。");
      expect(output).not.toContain(password);
      expect(output).not.toContain("postgresql://");
      expect(output).not.toContain("ref%0Asecret");
    },
  );

  it.each(["", "n", "N", "yes"])(
    "y以外の回答では子プロセスを起動しない（%s）",
    async (answer) => {
      mocks.question.mockResolvedValue(answer);
      await runUntilCancelled();
      expect(mocks.question).toHaveBeenCalledWith(
        "本番DBへmigrationを適用しますか？ [y/N] ",
      );
      expect(mocks.close).toHaveBeenCalledOnce();
      expect(mocks.spawn).not.toHaveBeenCalled();
    },
  );

  it("yの確認後だけ、専用ファイルの接続先を子プロセスへ渡す", async () => {
    mocks.question.mockResolvedValue("y");
    mocks.spawn.mockReturnValue({ stdout: null, stderr: null, on: vi.fn() });
    await import("./migrate-production");
    await vi.waitFor(() => expect(mocks.spawn).toHaveBeenCalledOnce());
    expect(mocks.spawn).toHaveBeenCalledWith(
      process.execPath,
      [expect.stringContaining("drizzle-kit/bin.cjs"), "migrate"],
      expect.objectContaining({
        env: expect.objectContaining({ DATABASE_URL: databaseUrl }),
        stdio: ["ignore", "pipe", "pipe"],
      }),
    );
    expect(logs.mock.calls.flat().join("\n")).not.toContain(password);
  });

  it("専用ファイルが読めない場合は他の接続先へフォールバックしない", async () => {
    mocks.readFile.mockRejectedValue(new Error("dummy read failure"));
    await import("./migrate-production");
    await vi.waitFor(() => expect(process.exitCode).toBe(1));
    expect(mocks.readFile).toHaveBeenCalledOnce();
    expect(mocks.question).not.toHaveBeenCalled();
    expect(mocks.spawn).not.toHaveBeenCalled();
  });
});
