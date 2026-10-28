import { Compass } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { StateMessage } from "@/components/features/shared/states"

export const metadata: Metadata = { title: "Page not found" }

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <StateMessage
        icon={Compass}
        title="Page not found"
        description="The page you're looking for doesn't exist or has moved."
        action={
          <Button asChild size="lg">
            <Link href="/score">Back to dashboard</Link>
          </Button>
        }
      />
    </main>
  )
}
