"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "~/frontend/components/ui/button";

/**
 * Googleログインを開始する画面を表示し、開始中の重複操作を防ぐ。
 * 開始に失敗するとエラーを表示し、再試行できる状態に戻す。
 */
export function LoginScreen() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [hasError, setHasError] = useState(false);
  const login = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    setHasError(false);
    try {
      await signIn("google");
    } catch {
      setHasError(true);
      setIsSigningIn(false);
    }
  };
  return (
    <section className="space-y-6 rounded-xl border bg-background p-6 shadow-sm">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">ログインが必要です</h1>
        <p className="text-sm text-muted-foreground">
          このページを開くにはログインしてください。ログイン後、このページを表示します。
        </p>
      </header>
      {hasError && (
        <p role="alert" className="text-destructive">
          ログインを開始できませんでした。時間をおいて再度お試しください。
        </p>
      )}
      <Button
        className="w-full"
        disabled={isSigningIn}
        onClick={() => {
          void login();
        }}
      >
        {isSigningIn ? "ログイン中..." : "Googleでログイン"}
      </Button>
      <Link href="/" className="inline-block font-medium underline">
        ホームへ戻る
      </Link>
    </section>
  );
}
