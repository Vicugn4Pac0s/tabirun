"use client";

import Link from "next/link";
import { PageContainer } from "~/frontend/components/app-ui/PageContainer";
import { Button } from "~/frontend/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main>
      <PageContainer>
        <section className="space-y-6 rounded-xl border bg-background p-6 shadow-sm">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold">エラーが発生しました</h1>
            <p role="alert" className="text-sm text-muted-foreground">
              ページを表示できませんでした。もう一度お試しいただくか、ホームへお戻りください。
            </p>
          </header>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={reset}>
              もう一度試す
            </Button>
            <Button asChild variant="outline">
              <Link href="/">ホームへ戻る</Link>
            </Button>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
