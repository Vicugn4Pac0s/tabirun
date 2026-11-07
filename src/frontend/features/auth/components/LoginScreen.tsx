"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "~/frontend/components/ui/button";
import { parseReturnTo } from "~/shared/schemas/auth";

type LoginScreenProps = { returnTo: string };

export function LoginScreen({ returnTo }: LoginScreenProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [hasError, setHasError] = useState(false);
  const login = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    setHasError(false);
    try {
      await signIn("google", {
        redirectTo: `/login?returnTo=${encodeURIComponent(parseReturnTo(returnTo))}`,
      });
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
          このページを開くにはログインしてください。ログイン後、元のページへ戻ります。
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
