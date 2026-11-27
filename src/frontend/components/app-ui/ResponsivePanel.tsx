"use client";

import { useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { Content as DialogPrimitiveContent } from "@radix-ui/react-dialog";
import { useIsMobile } from "~/frontend/hooks/shared/useIsMobile";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
} from "~/frontend/components/ui/drawer";
import {
  Dialog,
  DialogClose,
  DialogPortal,
  DialogTitle,
} from "~/frontend/components/ui/dialog";

type ResponsivePanelProps = {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

/** 内容をPCでは右側、モバイルでは下端に表示し、開閉時のフォーカスを管理する。 */
export function ResponsivePanel({
  title,
  open,
  onOpenChange,
  children,
}: ResponsivePanelProps) {
  const isMobile = useIsMobile();
  const id = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const PanelTitle = isMobile ? DrawerTitle : DialogTitle;
  const PanelClose = isMobile ? DrawerClose : DialogClose;

  const panelContent = (
    <aside aria-label={title} className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b bg-background px-6 py-3 text-foreground">
        <PanelTitle className="text-xl font-bold">{title}</PanelTitle>
        <PanelClose asChild>
          <button
            ref={closeRef}
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            aria-label={`${title}を閉じる`}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </PanelClose>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </aside>
  );

  const focusOnOpen = (event: Event) => {
    event.preventDefault();
    const activeElement = document.activeElement;
    // 幅変更時はbodyにフォーカスが移るため、最初に開いた操作元を保持する。
    if (
      activeElement instanceof HTMLElement &&
      activeElement !== document.body
    ) {
      triggerRef.current = activeElement;
    }
    closeRef.current?.focus();
  };
  const focusOnClose = (event: Event) => {
    event.preventDefault();
    // 幅変更によるパネル切り替えでは、開いたパネル内のフォーカスを保つ。
    if (!open) triggerRef.current?.focus();
  };

  return (
    <>
      {isMobile ? (
        <Drawer
          open={open}
          onOpenChange={onOpenChange}
          shouldScaleBackground={false}
        >
          <DrawerContent
            id={id}
            aria-describedby={undefined}
            className="h-[50dvh] max-h-[50dvh] gap-0 rounded-t-lg bg-background"
            onOpenAutoFocus={focusOnOpen}
            onCloseAutoFocus={focusOnClose}
          >
            {panelContent}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
          <DialogPortal>
            <DialogPrimitiveContent
              id={id}
              aria-describedby={undefined}
              className="fixed inset-y-0 right-0 z-50 flex h-dvh w-80 flex-col border-l bg-background shadow-lg duration-150 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full motion-reduce:animate-none"
              onOpenAutoFocus={focusOnOpen}
              onCloseAutoFocus={focusOnClose}
              onInteractOutside={(event) => event.preventDefault()}
            >
              {panelContent}
            </DialogPrimitiveContent>
          </DialogPortal>
        </Dialog>
      )}
    </>
  );
}
