import { useReducedMotion } from 'framer-motion'
import { InfinityXCanvas } from '@/components/InfinityXCanvas'

export function AnimatedBackground() {
  const reduce = useReducedMotion()

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[#020508]" />
      <div className="x-grid absolute -inset-[12%] opacity-35" />
      <div className="x-haze absolute inset-0" />
      <div className="x-vignette absolute inset-0" />
      <InfinityXCanvas />
      <div className="x-atmosphere absolute inset-0" />
      {!reduce ? <div className="x-scan absolute inset-0 opacity-[0.18]" /> : null}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020508]/25 via-transparent to-[#020508]" />
    </div>
  )
}
