import Link from "next/link"

import { BrandMark } from "@/components/features/layout/brand"
import { cn } from "@/lib/utils"

export function Logo({ href, className }: { href?: string; className?: string }) {
  const content = (
    <>
      <BrandMark />
      <span className="font-semibold tracking-tight">Fair Credit Scorer</span>
    </>
  )
  const classes = cn("flex items-center gap-2.5 rounded-lg", className)
  return href ? (
    <Link href={href} className={classes} aria-label="Fair Credit Scorer home">
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  )
}
