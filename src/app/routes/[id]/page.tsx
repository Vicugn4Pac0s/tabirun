import { TRPCError } from "@trpc/server";
import { SessionProvider } from "next-auth/react";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { RouteDetailScreen } from "~/frontend/features/route/components/RouteDetailScreen";
import { auth } from "~/server/auth";
import { getUserHomePageSettings } from "~/server/features/user/queries";
import { api } from "~/trpc/server";

type RouteDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RouteDetailPage({
  params,
}: RouteDetailPageProps) {
  const { id } = await params;
  const parsedId = z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().int().positive().safe())
    .safeParse(id);
  if (!parsedId.success) notFound();
  const returnTo = `/routes/${id}`;
  const session = await auth();
  if (!session?.user?.id)
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);

  const user = await getUserHomePageSettings(session.user.id);
  if (user && !user.profileCompletedAt)
    redirect(`/setup-profile?returnTo=${encodeURIComponent(returnTo)}`);

  const route = await api.route
    .getById({ id: parsedId.data })
    .catch((error: unknown) => {
      if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
      throw error;
    });

  return (
    <SessionProvider session={session}>
      <main>
        <RouteDetailScreen key={route.id} route={route} />
      </main>
    </SessionProvider>
  );
}
