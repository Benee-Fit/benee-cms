import * as React from "react"

import { cn } from "@repo/design-system/lib/utils"

function VisuallyHidden({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        className
      )}
      {...props}
    />
  )
}

export { VisuallyHidden }