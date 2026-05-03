"use client";

import type { ReactNode } from "react";
import { Button } from "~/frontend/components/ui/button";

interface RouteDetailHeaderProps {
  titleContent: ReactNode;
  onBack: () => void;
}

function RouteDetailHeader({
  titleContent,
  onBack,
}: RouteDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm text-gray-500">保存済みルート</p>
        {titleContent}
      </div>
      <Button type="button" variant="outline" onClick={onBack}>
        一覧に戻る
      </Button>
    </div>
  );
}

export default RouteDetailHeader;
