import "server-only";

import { genderSchema } from "~/shared/schemas";

/** DBの性別をフォーム用に検証し、未設定・選択肢外ならundefinedを返す。 */
export function getProfileGender(value: unknown) {
  const result = genderSchema.safeParse(value);
  return result.success ? result.data : undefined;
}
