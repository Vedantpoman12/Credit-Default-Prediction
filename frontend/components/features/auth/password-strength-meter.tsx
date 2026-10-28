import { passwordStrength } from "@/lib/password-strength"
import { cn } from "@/lib/utils"

const FILL = ["", "bg-destructive", "bg-track-strong", "bg-primary/70", "bg-primary"]

export function PasswordStrengthMeter({ password, id }: { password: string; id: string }) {
  const { score, label } = passwordStrength(password)
  return (
    <div id={id} className="space-y-1.5" aria-live="polite">
      <div className="grid grid-cols-4 gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((step) => (
          <span key={step} className={cn("h-1.5 rounded-full transition-colors duration-300", step <= score ? FILL[score] : "bg-track")} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {password ? (
          <>
            Strength: <span className="font-medium text-foreground">{label}</span>
            {score > 0 && score < 3 ? " · add length, numbers or symbols" : ""}
          </>
        ) : (
          "Use at least 8 characters."
        )}
      </p>
    </div>
  )
}
