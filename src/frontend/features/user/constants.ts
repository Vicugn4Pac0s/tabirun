import type { GENDER_VALUES } from "~/shared/schemas";

type SelectOption = {
  value: (typeof GENDER_VALUES)[number];
  label: string;
};

export const genderOptions: SelectOption[] = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "その他" },
  { value: "prefer_not_to_say", label: "回答しない" },
];
