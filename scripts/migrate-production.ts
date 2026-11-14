import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { createInterface as createOutputLines } from "node:readline";
import { stdin, stdout, stderr } from "node:process";
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

function createRedactor(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const secrets = new Set([databaseUrl, url.href, url.password]);
  try {
    secrets.add(decodeURIComponent(url.password));
  } catch {
    // 不正なpercent encodingでも元の表記を伏せる。
  }
  for (const secret of [...secrets]) {
    if (secret) {
      secrets.add(encodeURIComponent(secret));
      secrets.add(JSON.stringify(secret).slice(1, -1));
    }
  }
  const values = [...secrets]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  return (line: string) => {
    let redacted = line.replace(
      /postgres(?:ql)?:\/\/[^\s"'<>]+/gi,
      "[REDACTED_DATABASE_URL]",
    );
    for (const value of values)
      redacted = redacted.replaceAll(value, "[REDACTED]");
    return redacted;
  };
}

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

  const databaseUrl = new URL(result.data);
  // poolerのホストは共有されるため、ユーザー名のrefでプロジェクトを照合する。
  const projectRef = /^postgres\.([a-z0-9]+)$/.exec(databaseUrl.username)?.[1];
  console.log(`本番DB migrationの接続先ホスト: ${databaseUrl.hostname}`);
  console.log(
    `接続先プロジェクトref: ${projectRef ?? "判別できません。専用ファイルの接続先を管理画面と照合してください。"}`,
  );
  console.log(
    "接続先が本番プロジェクトか確認してください。列の追加などはデプロイ前に適用し、破壊的な変更は適用手順とコードとの互換性を確認してください。",
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
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const redact = createRedactor(result.data);
  for (const [input, output] of [
    [child.stdout, stdout],
    [child.stderr, stderr],
  ] as const) {
    if (!input) continue;
    // chunkの境界で秘密値が分かれても漏れないよう、行単位で伏せる。
    const lines = createOutputLines({ input, crlfDelay: Infinity });
    lines.on("line", (line) => output.write(`${redact(line)}\n`));
  }
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
