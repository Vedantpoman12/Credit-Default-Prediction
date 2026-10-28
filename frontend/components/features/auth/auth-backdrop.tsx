"use client"

import { motion } from "motion/react"

const ORBS = [
  { className: "top-[-12%] left-[-18%] size-[30rem] bg-primary/15", x: [0, 40, 0], y: [0, 30, 0], duration: 18 },
  { className: "bottom-[-22%] right-[-12%] size-[34rem] bg-primary/10", x: [0, -30, 0], y: [0, -40, 0], duration: 22 },
  { className: "top-[38%] right-[18%] size-[14rem] bg-accent", x: [0, 20, 0], y: [0, -20, 0], duration: 15 },
]

export function DotGrid({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--color-dot)_1px,transparent_0)] bg-size-[22px_22px] ${className}`} />
}

export function AuthBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${orb.className}`}
          animate={{ x: orb.x, y: orb.y }}
          transition={{ duration: orb.duration, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <DotGrid className="[mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
    </div>
  )
}
