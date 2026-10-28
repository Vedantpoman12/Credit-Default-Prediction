import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { BrandMark } from "@/components/features/layout/brand"
import { GlobalSearch } from "@/components/features/layout/global-search"
import { ThemeToggle } from "@/components/features/layout/theme-toggle"
import { UserMenu } from "@/components/features/layout/user-menu"

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-(--topbar-height) items-center gap-3 border-b bg-background/80 px-(--gutter) backdrop-blur-md">
      <BrandMark className="md:hidden" />
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  )
}
