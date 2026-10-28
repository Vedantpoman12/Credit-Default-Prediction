"use client"

import { AnimatePresence, motion } from "motion/react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { useHydrated } from "@/hooks/use-local-storage-flag"

/** Switches theme with a brief colour cross-fade (skipped when reduced motion is preferred). */
export function useSmoothTheme() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const change = (next: string) => {
    const root = document.documentElement
    root.classList.add("theme-transition")
    setTheme(next)
    window.setTimeout(() => root.classList.remove("theme-transition"), 300)
  }
  return { theme, resolvedTheme, change }
}

export function ThemeToggle() {
  const hydrated = useHydrated()
  const { resolvedTheme, change } = useSmoothTheme()
  const dark = hydrated && resolvedTheme === "dark"

  return (
    <Button variant="ghost" size="icon" onClick={() => change(dark ? "light" : "dark")} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? "moon" : "sun"}
          initial={{ opacity: 0, rotate: -60, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 60, scale: 0.7 }}
          transition={{ duration: 0.18 }}
          className="flex"
        >
          {dark ? <Moon /> : <Sun />}
        </motion.span>
      </AnimatePresence>
    </Button>
  )
}
