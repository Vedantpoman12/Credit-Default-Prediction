import { Footer } from "@/components/features/landing/footer"
import { Navbar } from "@/components/features/landing/navbar"

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
