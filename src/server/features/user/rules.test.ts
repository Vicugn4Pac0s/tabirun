import { describe, expect, it, vi } from "vitest";
import { getProfileGender } from "~/server/features/user/rules";

vi.mock("server-only", () => ({}));

describe("getProfileGender", () => {
  it.each(["male", "female", "other", "prefer_not_to_say"])(
    "選択肢 %s をそのまま返す",
    (value) => {
      expect(getProfileGender(value)).toBe(value);
    },
  );

  it.each([undefined, null, "", "invalid", "MALE", "male ", 1])(
    "未設定・選択肢外の値 %s をundefinedにする",
    (value) => {
      expect(getProfileGender(value)).toBeUndefined();
    },
  );
});
