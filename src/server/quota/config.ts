/**
 * クォータ設定マスタ（ハードコーディング）
 * 将来的にプラン別・月次制限なども追加予定
 */
export const QUOTA_CONFIG = {
  direction: {
    dailyLimit: 50,
  },
} as const satisfies Record<string, { dailyLimit: number }>;

export type QuotaFeature = keyof typeof QUOTA_CONFIG;
