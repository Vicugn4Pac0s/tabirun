"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { ArrowRight, MapPin, Plus, Route, UserRound } from "lucide-react";
import { AuthUserMenu } from "~/frontend/features/auth/components/AuthUserMenu";
import { Button } from "~/frontend/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/frontend/components/ui/avatar";
import { useUserQuery } from "~/frontend/features/user/hooks/useUserQuery";
import { UserProfileDialog } from "~/frontend/features/user/components/UserProfileDialog";
import { useRoutesQuery } from "~/frontend/features/route/hooks/useRoutesQuery";

function PersonalDashboard() {
  const { user, isLoading, error } = useUserQuery();
  const {
    routes,
    isLoading: routesLoading,
    error: routesError,
  } = useRoutesQuery();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <section
        aria-labelledby="profile-title"
        className="rounded-2xl border bg-white p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.image ?? undefined} alt="" />
              <AvatarFallback>
                <UserRound aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 id="profile-title" className="text-sm text-gray-500">
                マイプロフィール
              </h2>
              {isLoading ? (
                <p role="status">読み込み中...</p>
              ) : error ? (
                <p role="alert" className="text-red-600">
                  プロフィールを取得できませんでした。
                </p>
              ) : (
                <>
                  <p className="mt-1 text-xl font-bold">
                    {user?.name ?? "ランナー"}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    設定ペース：{user?.pace ?? "未設定"}
                  </p>
                </>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={() => setProfileOpen(true)}>
            プロフィールを編集
          </Button>
        </div>
      </section>
      <section aria-labelledby="routes-title" className="mt-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="routes-title" className="text-xl font-bold">
              登録ルート
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              お気に入りの道を、次のランニングへ。
            </p>
          </div>
          <Button asChild>
            <Link href="/routes/new">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              新しいルートを作る
            </Link>
          </Button>
        </div>
        {routesLoading ? (
          <p role="status" className="py-12 text-center">
            ルートを読み込み中...
          </p>
        ) : routesError ? (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-white p-6 text-red-600"
          >
            ルートを取得できませんでした。時間をおいて再度お試しください。
          </p>
        ) : routes.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white px-6 py-14 text-center">
            <Route
              className="mx-auto mb-4 h-8 w-8 text-gray-400"
              aria-hidden="true"
            />
            <h3 className="font-bold">最初のルートを作ってみましょう</h3>
            <p className="mb-5 mt-2 text-sm text-gray-500">
              地図とStreet Viewで道を確認しながら、自分だけのコースを作れます。
            </p>
            <Button variant="outline" asChild>
              <Link href="/routes/new">ルートを作る</Link>
            </Button>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {routes.map((route) => (
              <li key={route.id}>
                <Link
                  href={`/routes/${route.id}`}
                  className="group block h-full w-full rounded-2xl border bg-white p-6 text-left transition hover:border-gray-400 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                  <div className="mb-6 flex items-center justify-between text-gray-400">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                    <ArrowRight
                      className="h-4 w-4 transition group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="break-words text-lg font-bold">
                    {route.title?.trim() ? route.title : "無題のルート"}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {route.points.length} 地点
                  </p>
                  <p className="mt-4 text-xs text-gray-500">
                    更新日：
                    {new Intl.DateTimeFormat("ja-JP").format(
                      route.updatedAt ?? route.createdAt,
                    )}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <UserProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}

export function Dashboard() {
  const { status } = useSession();
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <span className="text-xl font-bold tracking-wider">TABIRUN</span>
          <AuthUserMenu />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-gray-500">MY HOME</p>
          <h1 className="text-3xl font-bold">次は、どこを走ろう？</h1>
          <p className="mt-3 text-gray-500">
            自分のルートを見つけて、ランニングの準備を始めましょう。
          </p>
        </div>
        {status === "loading" ? (
          <p role="status">読み込み中...</p>
        ) : status === "authenticated" ? (
          <PersonalDashboard />
        ) : (
          <section className="rounded-2xl border bg-white p-8 sm:p-12">
            <h2 className="text-xl font-bold">
              知らない道を、自分のコースに。
            </h2>
            <p className="mb-6 mt-3 text-gray-600">
              地図とStreet
              Viewで下見しながら、ランニングルートを作成・保存できます。
            </p>
            <Button onClick={() => void signIn()}>ログインして始める</Button>
          </section>
        )}
      </div>
    </div>
  );
}
