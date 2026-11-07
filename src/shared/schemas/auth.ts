import { z } from "zod";

// 戻り先を既存の画面に限定し、外部遷移とログイン・初期設定の循環を防ぐ。
export const returnToSchema = z.string().refine((path) => {
  if (["/", "/routes/new", "/settings/profile"].includes(path)) return true;
  const match = /^\/routes\/([1-9]\d*)(?:\/edit)?$/.exec(path);
  return Boolean(
    match && match[0] === path && Number.isSafeInteger(Number(match[1])),
  );
});

export function parseReturnTo(value: unknown): string {
  const result = returnToSchema.safeParse(value);
  return result.success ? result.data : "/";
}
