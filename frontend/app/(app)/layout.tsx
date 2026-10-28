import { BottomNav } from "@/components/features/layout/bottom-nav"
import { Sidebar } from "@/components/features/layout/sidebar"
import { Topbar } from "@/components/features/layout/topbar"

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main id="main" className="mx-auto w-full max-w-(--content-max) flex-1 px-(--gutter) pt-6 pb-24 md:pt-8 md:pb-12">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
