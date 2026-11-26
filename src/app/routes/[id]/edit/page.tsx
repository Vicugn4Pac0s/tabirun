import { TRPCError } from "@trpc/server";
import { SessionProvider } from "next-auth/react";
import { notFound } from "next/navigation";
import { routeIdParamSchema } from "~/shared/schemas";

import { RouteEditMap } from "~/frontend/features/route/screens/RouteEditMap";
import { ProtectedPageFallback } from "~/app/_components/ProtectedPageFallback";
import { getProtectedPageState } from "~/server/auth/getProtectedPageState";
import { api } from "~/trpc/server";

type RouteEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RouteEditPage({ params }: RouteEditPageProps) {
  const { id } = await params;
  const parsedId = routeIdParamSchema.safeParse(id);
  if (!parsedId.success) notFound();
  const state = await getProtectedPageState();
  if (state.status !== "ready") {
    return <ProtectedPageFallback state={state} />;
  }

  const route = await api.route
    .getById({ id: parsedId.data })
    .catch((error: unknown) => {
      if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
      throw error;
    });

  return (
    <SessionProvider session={state.session}>
      <main>
        <RouteEditMap key={route.id} route={route} />
      </main>
    </SessionProvider>
  );
}
