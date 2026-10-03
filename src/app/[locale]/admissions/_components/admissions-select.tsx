"use client"

import type { ComponentProps } from "react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AdmissionsSelect<Value extends string>({
  items,
  value,
  onValueChange,
  placeholder,
  ...props
}: {
  items: { value: Value; label: string }[]
  value: Value | null
  onValueChange: (value: Value) => void
  placeholder: string
} & Pick<
  ComponentProps<typeof SelectTrigger>,
  "id" | "aria-invalid" | "aria-describedby"
>) {
  return (
    <Select
      items={[{ value: null, label: placeholder }, ...items]}
      value={value}
      onValueChange={(next) => {
        if (next !== null) onValueChange(next)
      }}
    >
      <SelectTrigger
        className="h-auto min-h-11 w-full min-w-0 whitespace-normal"
        {...props}
      >
        <SelectValue className="min-w-0" />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem
              className="min-h-11 **:data-[slot=select-item-text]:whitespace-normal"
              key={item.value}
              value={item.value}
            >
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
