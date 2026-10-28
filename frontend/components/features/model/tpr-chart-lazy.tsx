"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"
import type { TprPoint } from "@/components/features/model/tpr-chart"

const TprChart = dynamic(() => import("@/components/features/model/tpr-chart"), {
  ssr: false,
  loading: () => <Skeleton className="h-65 w-full rounded-lg" />,
})

export function TprChartLazy({ data }: { data: TprPoint[] }) {
  return <TprChart data={data} />
}
