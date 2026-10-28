"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { NAV_ITEMS, isActive } from "@/components/features/layout/nav-items"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {active && <motion.span layoutId="bottom-nav-active" className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-primary" />}
                <motion.span whileTap={{ scale: 0.9 }} className="flex">
                  <item.icon className="size-5" aria-hidden />
                </motion.span>
                {item.short}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
