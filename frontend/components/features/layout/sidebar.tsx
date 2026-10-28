"use client"

import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Info, PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { BrandMark } from "@/components/features/layout/brand"
import { NAV_ITEMS, isActive } from "@/components/features/layout/nav-items"
import { useLocalStorageFlag } from "@/hooks/use-local-storage-flag"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }

export function Sidebar() {
  const pathname = usePathname()
  const desktop = useMediaQuery("(min-width: 1024px)", true)
  const [userCollapsed, setUserCollapsed] = useLocalStorageFlag("sidebar-collapsed")
  const collapsed = !desktop || userCollapsed

  return (
    <motion.aside
      aria-label="Primary"
      initial={false}
      animate={{ width: collapsed ? "var(--sidebar-width-collapsed)" : "var(--sidebar-width)" }}
      transition={{ type: "spring", stiffness: 420, damping: 40 }}
      className="sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden border-r bg-sidebar md:flex"
    >
      <div className="flex h-(--topbar-height) shrink-0 items-center gap-2.5 px-5">
        <BrandMark />
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span {...fade} className="truncate text-[15px] font-semibold tracking-tight">
              Fair Credit Scorer
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          const link = (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex h-10 items-center gap-3 rounded-control px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                active ? "text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {active && <motion.span layoutId="sidebar-active" className="absolute inset-0 rounded-control bg-sidebar-accent" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <item.icon className="relative z-10 size-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
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

      <div className="space-y-3 p-3">
        <AnimatePresence initial={false} mode="wait">
          {collapsed ? (
            <Tooltip key="info">
              <TooltipTrigger asChild>
                <motion.span {...fade} tabIndex={0} className="mx-auto flex size-10 items-center justify-center rounded-control text-muted-foreground" aria-label="Educational artefact. Not for real lending decisions.">
                  <Info className="size-[18px]" strokeWidth={1.75} aria-hidden />
                </motion.span>
              </TooltipTrigger>
              <TooltipContent side="right">Educational artefact. Not for real lending decisions.</TooltipContent>
            </Tooltip>
          ) : (
            <motion.div key="card" {...fade} className="flex gap-2.5 rounded-control border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-px size-3.5 shrink-0" aria-hidden />
              <p>Educational artefact. Not for real lending decisions.</p>
            </motion.div>
          )}
        </AnimatePresence>
        {desktop && (
          <div className={cn("flex border-t pt-3", collapsed ? "justify-center" : "justify-end")}>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-control text-muted-foreground"
              onClick={() => setUserCollapsed(!userCollapsed)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
            >
              {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
            </Button>
          </div>
        )}
      </div>
    </motion.aside>
  )
}
