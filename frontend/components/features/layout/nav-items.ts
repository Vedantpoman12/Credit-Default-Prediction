import { ChartColumn, Gauge, History, type LucideIcon } from "lucide-react"

export type NavItem = { href: "/score" | "/decisions" | "/model"; label: string; short: string; icon: LucideIcon }

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/score", label: "Score applicant", short: "Score", icon: Gauge },
  { href: "/decisions", label: "Recent decisions", short: "Decisions", icon: History },
  { href: "/model", label: "Model & fairness", short: "Model", icon: ChartColumn },
]

export const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`)
