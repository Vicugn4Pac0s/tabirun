import { TRPCError } from "@trpc/server";
import { SessionProvider } from "next-auth/react";
import { notFound } from "next/navigation";
import { z } from "zod";

import { RouteDetailsEditScreen } from "~/frontend/features/route/components/RouteDetailsEditScreen";
import { ProtectedPageFallback } from "~/app/_components/ProtectedPageFallback";
import { getProtectedPageState } from "~/server/auth/getProtectedPageState";
import { api } from "~/trpc/server";

type RouteDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RouteDetailsPage({
  params,
}: RouteDetailsPageProps) {
  const { id } = await params;
  const parsedId = z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().int().positive())
    .safeParse(id);
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
        <RouteDetailsEditScreen key={route.id} route={route} />
      </main>
    </SessionProvider>
  );
}
