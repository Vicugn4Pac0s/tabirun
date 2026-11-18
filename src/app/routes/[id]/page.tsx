import { TRPCError } from "@trpc/server";
import { SessionProvider } from "next-auth/react";
import { notFound } from "next/navigation";
import { z } from "zod";

import { RouteDetailScreen } from "~/frontend/features/route/components/RouteDetailScreen";
import { renderProtectedPage } from "~/app/_lib/renderProtectedPage";
import { getProtectedPageState } from "~/server/auth/getProtectedPageState";
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
  return renderProtectedPage(
    await getProtectedPageState(),
    async ({ session }) => {
      const route = await api.route
        .getById({ id: parsedId.data })
        .catch((error: unknown) => {
          if (error instanceof TRPCError && error.code === "NOT_FOUND")
            notFound();
          throw error;
        });

      return (
        <SessionProvider session={session}>
          <main>
            <RouteDetailScreen key={route.id} route={route} />
          </main>
        </SessionProvider>
      );
    },
  );
}
