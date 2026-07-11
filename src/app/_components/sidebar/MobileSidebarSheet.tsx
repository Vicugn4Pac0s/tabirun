"use client";

import { X } from "lucide-react";
import { useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/frontend/components/ui/drawer";
import MobileSidebarTrigger from "./MobileSidebarTrigger";

interface MobileSidebarSheetProps {
  children: React.ReactNode;
}

function MobileSidebarSheet({ children }: MobileSidebarSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <MobileSidebarTrigger />
      </DrawerTrigger>
      <DrawerContent className="h-[72vh] max-h-[72vh] gap-0 rounded-t-2xl border-x-0 border-b-0">
        <DrawerHeader className="sr-only">
          <DrawerTitle>メニュー</DrawerTitle>
        </DrawerHeader>
        <DrawerClose className="absolute right-4 top-3 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DrawerClose>
        <div className="overflow-y-auto px-5 pb-4 pt-3">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}

export default MobileSidebarSheet;
