import { MapPinPlus, MapPinX, Play } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "~/frontend/lib/utils";

type Props = {
  type: "add" | "delete" | "play";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  onMouseOver?: () => void;
  onMouseOut?: () => void;
};

/** 地点追加・削除・再生のアイコンを操作ボタンに表示する。
 * アイコンだけの表示に読み上げ用ラベルを付け、実際の操作はコールバックへ委ねる。 */
const MainActionButton = ({
  type,
  className,
  disabled = false,
  onClick,
  onMouseOver,
  onMouseOut,
}: Props) => {
  let Icon;

  switch (type) {
    case "add":
      Icon = MapPinPlus;
      break;
    case "delete":
      Icon = MapPinX;
      break;
    case "play":
      Icon = Play;
      break;
  }
  return (
    <motion.button
      type="button"
      aria-label={
        type === "add"
          ? "地点を追加"
          : type === "delete"
            ? "地点を削除"
            : "再生"
      }
      className={cn(
        "flex h-16 w-16 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring hover:enabled:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 md:h-20 md:w-20",
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      whileTap={disabled ? undefined : { scale: 0.9 }}
      transition={{
        duration: 0.1,
      }}
    >
      <Icon className="h-8 w-8 md:h-10 md:w-10" />
    </motion.button>
  );
};
export default MainActionButton;
