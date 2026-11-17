import { useState } from "react";
import { paceSchema } from "~/shared/schemas";
import { useCurrentUserQuery } from "~/frontend/features/user/api/useCurrentUserQuery";
import type { Pace } from "~/frontend/types/pace";

const DEFAULT_PACE: Pace = "5:00";

/**
 * 試算用のペースと体重をプロフィールから取得し、選択したペースを優先する。
 * プロフィールのペースが未設定・不正なら5:00を使い、enabledがfalseなら取得を開始しない。
 */
export function useRunEstimateInputs(enabled = true) {
  const { user } = useCurrentUserQuery({ enabled });
  const [paceOverride, setPaceOverride] = useState<Pace | null>(null);
  const profilePace = paceSchema.safeParse(user?.pace);

  return {
    pace:
      paceOverride ?? (profilePace.success ? profilePace.data : DEFAULT_PACE),
    setPace: setPaceOverride,
    weightKg: user?.weight,
  };
}
