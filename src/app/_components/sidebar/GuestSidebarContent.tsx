"use client";

import { signIn } from "next-auth/react";
import { Button } from "~/frontend/components/ui/button";

function GuestSidebarContent() {
  return (
    <div className="space-y-4 text-center">
      <div className="space-y-2">
        <p className="text-lg font-bold text-base-gray">ログインしてルートを作成しましょう</p>
        <p className="text-sm text-gray-500">
          Directions API でルートを自動生成し、作成したルートを保存して管理できます。
        </p>
      </div>
      <Button className="w-full" onClick={() => signIn()}>
        Sign In
      </Button>
    </div>
  );
}

export default GuestSidebarContent;
