import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.97] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" +
"",
  {
    variants: {
      variant: {
        // Primary: one per screen for the main action.
        default:
          "bg-primary text-primary-foreground border border-transparent hover:brightness-[1.08] active:brightness-95",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm border border-transparent hover:brightness-[1.06]",
        // Secondary actions on a card or page.
        outline:
          "border border-border shadow-xs hover:bg-foreground/[0.05] active:shadow-none",
        secondary:
          "border border-transparent bg-secondary text-secondary-foreground hover:bg-foreground/[0.08]",
        // Low-emphasis actions (toolbars, menus).
        ghost: "border border-transparent hover:bg-foreground/[0.06]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Touch screens get 44px targets; mouse users keep the compact sizes.
        default: "min-h-9 px-4 py-2 pointer-coarse:min-h-11",
        sm: "min-h-8 rounded-md px-3 text-xs pointer-coarse:min-h-10",
        lg: "min-h-10 rounded-md px-8 pointer-coarse:min-h-12",
        icon: "h-9 w-9 pointer-coarse:h-11 pointer-coarse:w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Shows a spinner, disables the button and announces it as busy. */
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && !asChild ? <><Loader2 className="animate-spin" aria-hidden />{children}</> : children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
