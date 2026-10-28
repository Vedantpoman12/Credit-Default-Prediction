"use client"

import { MotionConfig } from "motion/react"
import { ThemeProvider } from "next-themes"
import type { ReactNode } from "react"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 380, damping: 32 }}>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster position="bottom-right" richColors={false} closeButton />
        </TooltipProvider>
      </MotionConfig>
    </ThemeProvider>
  )
}
