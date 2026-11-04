import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { parse } from "dotenv";
import { z } from "zod";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const productionEnvFile = new URL(
  "../.env.db-production.local",
  import.meta.url,
);
const databaseUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      ["postgres:", "postgresql:"].includes(url.protocol) && !!url.hostname
    );
  });

async function main() {
  let contents: string;
  try {
    contents = await readFile(productionEnvFile, "utf8");
  } catch {
    console.error(
      ".env.db-production.localを読み込めません。何も実行しません。",
    );
    process.exitCode = 1;
    return;
  }

  const result = databaseUrlSchema.safeParse(parse(contents).DATABASE_URL);
  if (!result.success) {
    console.error(
      "本番用ファイルのDATABASE_URLが未設定または不正です。何も実行しません。",
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `本番DB migrationの接続先ホスト: ${new URL(result.data).hostname}`,
  );
  console.log(
    "本番デプロイが完了し、接続先が本番DBであることを確認してください。",
  );
  const prompt = createInterface({ input: stdin, output: stdout });
  let answer: string;
  try {
    answer = await prompt.question("本番DBへmigrationを適用しますか？ [y/N] ");
  } catch {
    console.log("\nキャンセルしました。何も実行していません。");
    return;
  } finally {
    prompt.close();
  }
  if (answer.trim().toLowerCase() !== "y") {
    console.log("キャンセルしました。何も実行していません。");
    return;
  }

  console.log("本番DBへmigrationを適用しています...");
  const child = spawn(
    process.execPath,
    [
      fileURLToPath(
        new URL("../node_modules/drizzle-kit/bin.cjs", import.meta.url),
      ),
      "migrate",
    ],
    {
      cwd: projectRoot,
      // CLI起動時の境界でのみ環境を渡す。通常の.envや親の接続先では上書きさせない。
      env: { ...process.env, DATABASE_URL: result.data },
      // ドライバーのエラーに接続文字列が含まれる可能性があるため転送しない。
      stdio: "ignore",
    },
  );
  child.on("error", () => {
    console.error("migrationコマンドを起動できませんでした。");
    process.exitCode = 1;
  });
  child.on("close", (code, signal) => {
    if (code === 0) {
      console.log("本番DBへのmigrationが完了しました。");
    } else {
      console.error(
        `migrationは正常終了していません（${signal ?? code ?? "起動失敗"}）。DBの状態を確認し、再実行は控えてください。`,
      );
      process.exitCode = code && code > 0 ? code : 1;
    }
  });
}

void main().catch(() => {
  console.error("本番migrationコマンドでエラーが発生しました。");
  process.exitCode = 1;
});
