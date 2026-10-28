"use client"

import { AnimatePresence, motion } from "motion/react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type MotionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

/** Radix dialog whose overlay and panel animate in and out with AnimatePresence. */
export function MotionDialog({ open, onOpenChange, title, description, children, className }: MotionDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                className={cn(
                  "fixed top-1/2 left-1/2 z-50 flex max-h-[min(85dvh,44rem)] w-[calc(100%-2rem)] max-w-lg flex-col rounded-2xl border bg-popover text-popover-foreground shadow-elevated outline-none",
                  className,
                )}
                style={{ x: "-50%" }}
                initial={{ opacity: 0, scale: 0.97, y: "-47%" }}
                animate={{ opacity: 1, scale: 1, y: "-50%" }}
                exit={{ opacity: 0, scale: 0.98, y: "-48%" }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              >
                <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
                  <div className="space-y-1">
                    <DialogPrimitive.Title className="font-semibold tracking-tight">{title}</DialogPrimitive.Title>
                    {description ? <DialogPrimitive.Description className="text-sm text-muted-foreground">{description}</DialogPrimitive.Description> : null}
                  </div>
                  <DialogPrimitive.Close asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Close">
                      <XIcon />
                    </Button>
                  </DialogPrimitive.Close>
                </div>
                <div className="overflow-y-auto px-5 py-4">{children}</div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
