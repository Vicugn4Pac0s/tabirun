import {
  ArrowLeft,
  ArrowLeftToLine,
  ArrowRight,
  ArrowRightToLine,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "~/frontend/lib/utils";

type Props = {
  type: "first" | "prev" | "next" | "last";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  onMouseOver?: () => void;
  onMouseOut?: () => void;
};

/** 先頭・前・次・末尾への移動ボタンを表示する。移動可否と操作は呼出側で決める。 */
const SubActionButton = ({
  type,
  disabled = false,
  className,
  onClick,
  onMouseOver,
  onMouseOut,
}: Props) => {
  let Icon;
  let text;

  switch (type) {
    case "first":
      Icon = ArrowLeftToLine;
      text = "最初へ";
      break;
    case "prev":
      Icon = ArrowLeft;
      text = "前へ";
      break;
    case "next":
      Icon = ArrowRight;
      text = "次へ";
      break;
    case "last":
      Icon = ArrowRightToLine;
      text = "最後へ";
      break;
  }
  return (
    <motion.button
      type="button"
      className={cn(
        "flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-transparent text-xs leading-none text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring hover:enabled:bg-muted disabled:cursor-not-allowed disabled:opacity-40 md:w-14",
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      whileTap={disabled ? undefined : { backgroundColor: "hsl(var(--muted))" }}
      transition={{
        duration: 0.1,
      }}
    >
      <Icon className="h-5 w-5" />
      <span>{text}</span>
    </motion.button>
  );
};
export default SubActionButton;
