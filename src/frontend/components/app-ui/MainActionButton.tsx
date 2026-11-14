import { MapPinPlus, MapPinX, Play } from "lucide-react";
import { motion } from "motion/react";

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
      aria-label={
        type === "add"
          ? "地点を追加"
          : type === "delete"
            ? "地点を削除"
            : "再生"
      }
      className={`flex h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-primary text-white transition-opacity disabled:opacity-50 ${className}`}
      disabled={disabled}
      onClick={onClick}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      whileTap={disabled ? undefined : { scale: 0.9 }}
      transition={{
        duration: 0.1,
      }}
    >
      <Icon className="h-12 w-12" />
    </motion.button>
  );
};
export default MainActionButton;
