import { MapPinPlus, MapPinX, Play } from "lucide-react";
import { motion } from "motion/react";

type Props = {
  type: "add" | "delete" | "play";
  className?: string;
  onClick?: () => void;
  onMouseOver?: () => void;
  onMouseOut?: () => void;
};

const MainActionButton = ({
  type,
  className,
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
      className={`flex h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-primary text-white ${className}`}
      onClick={onClick}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      whileTap={{ scale: 0.9 }}
      transition={{
        duration: 0.1,
      }}
    >
      <Icon className="h-12 w-12" />
    </motion.button>
  );
};
export default MainActionButton;
