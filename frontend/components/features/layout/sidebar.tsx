"use client"

import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { BrandMark } from "@/components/features/layout/brand"
import { NAV_ITEMS, isActive } from "@/components/features/layout/nav-items"
import { useLocalStorageFlag } from "@/hooks/use-local-storage-flag"
import { cn } from "@/lib/utils"

const fade = { initial: { opacity: 0, x: -4 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -4 }, transition: { duration: 0.15 } }

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useLocalStorageFlag("sidebar-collapsed")

  return (
    <motion.aside
      aria-label="Primary"
      initial={false}
      animate={{ width: collapsed ? "var(--sidebar-width-collapsed)" : "var(--sidebar-width)" }}
      className="sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden border-r bg-sidebar md:flex"
    >
      <div className="flex h-(--topbar-height) items-center gap-2.5 border-b px-4.5">
        <BrandMark />
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span {...fade} className="truncate font-semibold tracking-tight">
              Fair Credit Scorer
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          const link = (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                active ? "text-sidebar-accent-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && (
                <motion.span layoutId="sidebar-active" className="absolute inset-0 rounded-lg bg-sidebar-accent" transition={{ type: "spring", stiffness: 500, damping: 38 }} />
              )}
              <motion.span whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} className="relative z-10 flex">
                <item.icon className="size-4.5 shrink-0" aria-hidden />
              </motion.span>
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span {...fade} className="relative z-10 truncate">
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {collapsed && <span className="sr-only">{item.label}</span>}
            </Link>
          )
          return collapsed ? (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ) : (
            link
          )
        })}
      </nav>

      <div className="space-y-3 border-t p-3">
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.p {...fade} className="px-2 text-xs leading-relaxed text-muted-foreground">
              Educational artefact. Not for real lending decisions.
            </motion.p>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          className="ml-1.5 text-muted-foreground"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>
    </motion.aside>
  )
}
