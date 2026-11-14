import type { ReactNode } from "react";
import { cn } from "~/frontend/lib/utils";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

/** ページ内容の最大幅と余白を揃える。main要素は含めず、classNameでレイアウトを補える。 */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-lg px-4 py-10", className)}>
      {children}
    </div>
  );
}
