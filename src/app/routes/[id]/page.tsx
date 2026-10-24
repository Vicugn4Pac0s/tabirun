import { TRPCError } from "@trpc/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { RouteDetailMap } from "~/frontend/features/route/components/RouteDetailMap";
import { auth } from "~/server/auth";
import { getUserHomePageSettings } from "~/server/features/user/queries";
import { api } from "~/trpc/server";

type RouteDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RouteDetailPage({
  params,
}: RouteDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const user = await getUserHomePageSettings(session.user.id);
  if (user && !user.profileCompletedAt) redirect("/setup-profile");

  const { id } = await params;
  const parsedId = z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().int().positive().safe())
    .safeParse(id);
  if (!parsedId.success) notFound();

  const route = await api.route
    .getById({ id: parsedId.data })
    .catch((error: unknown) => {
      if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
      throw error;
    });

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-10 sm:px-8">
      <Link href="/" className="font-medium underline">
        ホームへ戻る
      </Link>
      <section className="mt-8 rounded-2xl border bg-white p-6 sm:p-8">
        <p className="text-sm text-gray-500">保存済みルート</p>
        <h1 className="mt-2 break-words text-2xl font-bold">
          {route.title?.trim() ? route.title : "無題のルート"}
        </h1>
        <RouteDetailMap points={route.points} />
        <h2 className="mb-4 mt-8 font-bold">
          経由地点（{route.points.length} 地点）
        </h2>
        <ol className="space-y-3">
          {route.points.map((point, index) => (
            <li key={index} className="rounded-lg bg-gray-50 p-3">
              <span className="font-medium">地点 {index + 1}</span>
              <p className="mt-1 break-words text-sm text-gray-600">
                緯度 {point.lat} ／ 経度 {point.lng}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
