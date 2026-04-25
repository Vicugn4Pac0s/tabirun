import { useMemo } from "react";

import { usePacesQuery } from "~/frontend/features/pace/hooks/usePacesQuery";

export const genderOptions = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "その他" },
  { value: "prefer_not_to_say", label: "回答しない" },
];

export const useUserProfileFieldOptions = () => {
  const { paces } = usePacesQuery();

  const paceOptions = useMemo(
    () =>
      paces.map((pace) => ({
        value: pace.value,
        label: pace.value,
      })),
    [paces],
  );

  return {
    genderOptions,
    paceOptions,
  };
};
