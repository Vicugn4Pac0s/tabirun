import { describe, expect, it } from "vitest";
import { getSafeReturnTo } from "./auth";

describe("getSafeReturnTo", () => {
  it.each([
    "/",
    "/routes/new",
    "/routes/123/edit",
    "/settings/profile",
    "/future-page",
    "/future-page?tab=recent#section",
    "/routes/abc",
    "/routes/new?returnTo=//example.com",
  ])("ページ一覧への登録なしでアプリ内URL %s を保持する", (path) => {
    expect(getSafeReturnTo(path)).toBe(path);
  });
  it.each([
    undefined,
    ["/routes/new"],
    "",
    "routes/new",
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/%2fexample.com",
    "/%5cexample.com",
    "/routes/1\n",
    "/%0aexample.com",
    "/%zz",
    "/%252fexample.com",
  ])("外部URL・不正値 %j はホームにする", (value) => {
    expect(getSafeReturnTo(value)).toBe("/");
  });
  it.each([
    "/login",
    "/login/",
    "/login?returnTo=/routes/new",
    "/setup-profile",
    "/setup-profile/#section",
    "/%6cogin",
    "/a/../login",
    "/a%2f..%2flogin",
  ])("認証画面への循環 %s はホームにする", (path) => {
    expect(getSafeReturnTo(path)).toBe("/");
  });
});
