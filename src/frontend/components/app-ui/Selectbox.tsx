import type { ComponentPropsWithoutRef } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/frontend/components/ui/select";

type SelectItemOption = {
  value: string;
  label: string;
};

type SelectboxProps = {
  items: SelectItemOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
} & Pick<
  ComponentPropsWithoutRef<"button">,
  "id" | "onBlur" | "aria-invalid" | "aria-describedby"
>;

/** 候補の選択UIを表示し、フォーム用のID・検証属性をトリガーに渡す。
 * labelは候補グループの見出しで、トリガーの読み上げ名はariaLabelで指定する。 */
export function Selectbox({
  items,
  value,
  onValueChange,
  placeholder = "Select",
  label,
  ariaLabel,
  disabled,
  className,
  ...triggerProps
}: SelectboxProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        {...triggerProps}
        aria-label={ariaLabel}
        className={className ?? "w-full max-w-48"}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {label && <SelectLabel>{label}</SelectLabel>}
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
