"use client"

import { useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { loginWithProvider } from "@/lib/actions/auth"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.1.9 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
    </svg>
  )
}

const PROVIDERS = [
  { id: "google", label: "Google", icon: GoogleIcon },
  { id: "github", label: "GitHub", icon: GitHubIcon },
] as const

export function SocialButtons({ enabled, callbackUrl }: { enabled: { google: boolean; github: boolean }; callbackUrl?: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <div className="grid grid-cols-2 gap-3">
      {PROVIDERS.map(({ id, label, icon: Icon }) => {
        const button = (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-10 w-full bg-card"
            disabled={!enabled[id] || pending}
            onClick={() => startTransition(() => loginWithProvider(id, callbackUrl))}
          >
            <Icon /> {label}
          </Button>
        )
        return enabled[id] ? (
          <div key={id}>{button}</div>
        ) : (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="rounded-lg">
                {button}
              </span>
            </TooltipTrigger>
            <TooltipContent>{label} sign-in isn&apos;t configured yet</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
