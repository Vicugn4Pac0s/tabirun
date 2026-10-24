import { TRPCError } from "@trpc/server";
import { SessionProvider } from "next-auth/react";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { RouteEditScreen } from "~/frontend/features/route/components/RouteEditScreen";
import { auth } from "~/server/auth";
import { getUserHomePageSettings } from "~/server/features/user/queries";
import { api } from "~/trpc/server";

type RouteEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RouteEditPage({ params }: RouteEditPageProps) {
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
    <SessionProvider session={session}>
      <main>
        <RouteEditScreen key={route.id} route={route} />
      </main>
    </SessionProvider>
  );
}
