import { z } from "zod";

// URLの解析専用。実際のホスト名やページ一覧の設定は不要。
const validationOrigin = "https://return-to.invalid";
const unsafeCharacters = /[\\\u0000-\u0020\u007f]/;

export function getSafeReturnTo(value: unknown): string {
  const result = z.string().safeParse(value);
  if (!result.success) return "/";
  const path = result.data;

  // 相対パスだけを受け付け、ブラウザによる外部URLへの解釈を防ぐ。
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    unsafeCharacters.test(path)
  ) {
    return "/";
  }

  try {
    const url = new URL(path, validationOrigin);
    const decodedPath = decodeURIComponent(url.pathname);
    if (unsafeCharacters.test(decodedPath) || decodedPath.includes("%"))
      return "/";
    const destination = new URL(decodedPath, validationOrigin);
    if (
      url.origin !== validationOrigin ||
      destination.origin !== validationOrigin
    )
      return "/";

    // エンコードや末尾スラッシュで迂回しても、認証画面の循環は許可しない。
    const pathname = destination.pathname.replace(/\/+$/, "");
    if (pathname === "/login" || pathname === "/setup-profile") return "/";

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
