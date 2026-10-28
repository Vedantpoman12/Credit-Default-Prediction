"use client"

import { animate, useInView, useMotionValue, useReducedMotion, useTransform, motion } from "motion/react"
import { useEffect, useRef } from "react"

type AnimatedNumberProps = {
  value: number
  format: (value: number) => string
  className?: string
}

export function AnimatedNumber({ value, format, className }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  const motionValue = useMotionValue(reduce ? value : 0)
  const text = useTransform(motionValue, format)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      motionValue.set(value)
      return
    }
    const controls = animate(motionValue, value, { duration: 0.9, ease: [0.22, 1, 0.36, 1] })
    return () => controls.stop()
  }, [inView, motionValue, reduce, value])

  return (
    <motion.span ref={ref} className={className} aria-label={format(value)}>
      {text}
    </motion.span>
  )
}
