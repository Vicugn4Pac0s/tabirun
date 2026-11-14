import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** 条件付きのclassを結合し、競合するTailwindの指定は後の指定を優先する。 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
