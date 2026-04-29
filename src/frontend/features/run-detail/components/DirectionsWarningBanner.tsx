import { type TRPCClientErrorLike } from "@trpc/client";
import { type AppRouter } from "~/server/api/root";

interface DirectionsWarningBannerProps {
  error: TRPCClientErrorLike<AppRouter>;
}

function getDirectionsWarningContent(
  error: TRPCClientErrorLike<AppRouter>,
) {
  if (error.data?.code === "TOO_MANY_REQUESTS") {
    return {
      title: "自動ルート生成の利用上限に達しました",
      description:
        "本日は直線ルートを表示しています。時間をおいて再度お試しください。",
    };
  }

  if (error.data?.code === "NOT_FOUND") {
    return {
      title: "自動ルートを生成できませんでした",
      description:
        "経由点を見直してください。現在は直線ルートを表示しています。",
    };
  }

  return {
    title: "自動ルート生成に失敗しました",
    description:
      "現在は直線ルートを表示しています。時間をおいて再度お試しください。",
  };
}

function DirectionsWarningBanner({ error }: DirectionsWarningBannerProps) {
  const content = getDirectionsWarningContent(error);

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm font-semibold text-amber-900">{content.title}</p>
      <p className="mt-1 text-sm text-amber-800">{content.description}</p>
    </div>
  );
}

export default DirectionsWarningBanner;
