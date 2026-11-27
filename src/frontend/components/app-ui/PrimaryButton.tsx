import type { ComponentProps } from "react";
import { cn } from "~/frontend/lib/utils";

type PrimaryButtonProps = ComponentProps<"button">;

/** 主要操作のボタンを表示する。送信に使う場合はtype="submit"を指定する。 */
export function PrimaryButton({
  type = "button",
  className,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 text-base font-bold text-primary-foreground shadow-md transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}
