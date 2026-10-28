import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { BrandMark } from "@/components/features/layout/brand"
import { GlobalSearch } from "@/components/features/layout/global-search"
import { UserMenu } from "@/components/features/layout/user-menu"

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-(--topbar-height) items-center gap-3 border-b bg-card/95 px-(--gutter) backdrop-blur-sm supports-backdrop-filter:bg-card/90">
      <BrandMark className="md:hidden" />
      <GlobalSearch />
      <div className="ml-auto flex items-center">
        <Suspense fallback={<Skeleton className="size-9 rounded-full" />}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  )
}
