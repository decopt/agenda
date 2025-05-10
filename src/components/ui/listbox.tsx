
import * as React from "react"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import * as ListboxPrimitive from "@radix-ui/react-select"

import { cn } from "@/lib/utils"

const Listbox = React.forwardRef<
  React.ElementRef<typeof ListboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ListboxPrimitive.Root>
>(({ children, ...props }, ref) => (
  <ListboxPrimitive.Root ref={ref} {...props}>
    {children}
  </ListboxPrimitive.Root>
))
Listbox.displayName = ListboxPrimitive.Root.displayName

const ListboxTrigger = React.forwardRef<
  React.ElementRef<typeof ListboxPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof ListboxPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <ListboxPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
    <ChevronDownIcon className="h-4 w-4 opacity-50" />
  </ListboxPrimitive.Trigger>
))
ListboxTrigger.displayName = ListboxPrimitive.Trigger.displayName

const ListboxContent = React.forwardRef<
  React.ElementRef<typeof ListboxPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ListboxPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <ListboxPrimitive.Portal>
    <ListboxPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <ListboxPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </ListboxPrimitive.Viewport>
    </ListboxPrimitive.Content>
  </ListboxPrimitive.Portal>
))
ListboxContent.displayName = ListboxPrimitive.Content.displayName

const ListboxItem = React.forwardRef<
  React.ElementRef<typeof ListboxPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ListboxPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <ListboxPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ListboxPrimitive.ItemIndicator>
        <CheckIcon className="h-4 w-4" />
      </ListboxPrimitive.ItemIndicator>
    </span>

    <ListboxPrimitive.ItemText>{children}</ListboxPrimitive.ItemText>
  </ListboxPrimitive.Item>
))
ListboxItem.displayName = ListboxPrimitive.Item.displayName

const ListboxLabel = React.forwardRef<
  React.ElementRef<typeof ListboxPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ListboxPrimitive.Label>
>(({ className, ...props }, ref) => (
  <ListboxPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
ListboxLabel.displayName = ListboxPrimitive.Label.displayName

const ListboxSeparator = React.forwardRef<
  React.ElementRef<typeof ListboxPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ListboxPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ListboxPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
ListboxSeparator.displayName = ListboxPrimitive.Separator.displayName

export {
  Listbox,
  ListboxTrigger,
  ListboxContent,
  ListboxItem,
  ListboxLabel,
  ListboxSeparator,
}
