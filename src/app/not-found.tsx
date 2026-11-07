import Link from "next/link";
import { PageContainer } from "~/frontend/components/app-ui/PageContainer";
import { Button } from "~/frontend/components/ui/button";

export default function NotFound() {
  return (
    <main>
      <PageContainer>
        <section className="space-y-6 rounded-xl border bg-background p-6 shadow-sm">
          <header className="space-y-2">
            <p className="text-sm text-muted-foreground">404</p>
            <h1 className="text-2xl font-semibold">ページが見つかりません</h1>
            <p className="text-sm text-muted-foreground">
              URLが正しいか確認するか、ホームへお戻りください。
            </p>
          </header>
          <Button asChild>
            <Link href="/">ホームへ戻る</Link>
          </Button>
        </section>
      </PageContainer>
    </main>
  );
}
