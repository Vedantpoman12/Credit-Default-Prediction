"use client"

import { AlertTriangle, RotateCcw } from "lucide-react"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StateMessage } from "@/components/features/shared/states"

export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Card className="shadow-card">
      <StateMessage
        tone="error"
        icon={AlertTriangle}
        title="Something went wrong"
        description="This page couldn't be displayed. The scoring service may be restarting. Try again in a moment."
        action={
          <Button variant="outline" size="lg" onClick={retry}>
            <RotateCcw /> Try again
          </Button>
        }
      />
    </Card>
  )
}
