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
