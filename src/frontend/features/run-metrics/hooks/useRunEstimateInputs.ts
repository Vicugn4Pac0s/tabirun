import { useState } from "react";
import { useCurrentUserQuery } from "~/frontend/features/user/api/useCurrentUserQuery";
import type { Pace } from "~/frontend/types/pace";

const DEFAULT_PACE: Pace = "5:00";

function isPace(value: string): value is Pace {
  return /^\d+:[0-5]\d$/.test(value);
}

export function useRunEstimateInputs(enabled = true) {
  const { user } = useCurrentUserQuery({ enabled });
  const [paceOverride, setPaceOverride] = useState<Pace | null>(null);
  const profilePace = user?.pace;

  return {
    pace:
      paceOverride ??
      (profilePace && isPace(profilePace) ? profilePace : DEFAULT_PACE),
    setPace: setPaceOverride,
    weightKg: user?.weight,
  };
}
