import { useState } from "react";
import { useCurrentUserQuery } from "~/frontend/features/user/api/useCurrentUserQuery";
import type { Pace } from "~/frontend/types/pace";

const DEFAULT_PACE: Pace = "5:00";

function isPace(value: string): value is Pace {
  return /^\d+:[0-5]\d$/.test(value);
}

/**
 * 試算用のペースと体重をプロフィールから取得し、選択したペースを優先する。
 * プロフィールのペースが未設定・不正なら5:00を使い、enabledがfalseなら取得を開始しない。
 */
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
