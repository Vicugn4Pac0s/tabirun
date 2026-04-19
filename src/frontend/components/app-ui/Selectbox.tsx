import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/frontend/components/ui/select"

type SelectItemOption = {
  value: string
  label: string
}

type SelectboxProps = {
  items: SelectItemOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  label?: string
  className?: string
}

export function Selectbox({
  items,
  value,
  onValueChange,
  placeholder = "Select",
  label,
  className,
}: SelectboxProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className ?? "w-full max-w-48"}>
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
  )
}