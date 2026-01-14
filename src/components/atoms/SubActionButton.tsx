import { ArrowLeft, ArrowLeftToLine, ArrowRight, ArrowRightToLine } from "lucide-react";
import { motion } from "motion/react";

type Props = {
  type: "first" | "prev" | "next" | "last";
  className?: string;
  onClick?: () => void;
  onMouseOver?: () => void;
  onMouseOut?: () => void;
};

const SubActionButton = ({
  type,
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
      className={`flex flex-col gap-1 items-center justify-center h-16 w-16 bg-white ${className}`}
      onClick={onClick}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      whileTap={{ backgroundColor: "#eee" }}
      transition={{
        duration: 0.1,
      }}
    >
      <Icon className="h-6 w-6" />
      <span>
        {text}
      </span>
    </motion.button>
  );
};
export default SubActionButton;
