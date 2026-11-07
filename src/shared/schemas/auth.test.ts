import { describe, expect, it } from "vitest";
import { parseReturnTo } from "./auth";

describe("parseReturnTo", () => {
  it.each([
    "/",
    "/routes/new",
    "/routes/123",
    "/routes/123/edit",
    "/settings/profile",
  ])("アプリ内の戻り先 %s を保持する", (path) => {
    expect(parseReturnTo(path)).toBe(path);
  });
  it.each([
    undefined,
    ["/routes/new"],
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/login",
    "/setup-profile",
    "/routes",
    "/routes/abc",
    "/routes/0",
    "/routes/9007199254740992",
    "/routes/new?returnTo=//example.com",
    "/routes/1\n",
  ])("不正な戻り先 %j はホームにする", (value) => {
    expect(parseReturnTo(value)).toBe("/");
  });
});
