import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const STAGES = [
  'INITIALIZING...',
  'LOADING INDEX...',
  'BUILDING RELATIONSHIP GRAPH...',
  'SYSTEM READY',
]

export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion()
  const [stage, setStage] = useState(0)

  useEffect(() => {
    if (reduce) {
      onDone()
      return
    }
    const id = window.setInterval(() => {
      setStage((s) => {
        if (s >= STAGES.length - 1) {
          window.clearInterval(id)
          window.setTimeout(onDone, 280)
          return s
        }
        return s + 1
      })
    }, 420)
    return () => window.clearInterval(id)
  }, [onDone, reduce])

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#05080d] grid-bg scanlines">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center px-6">
        <p className="text-[11px] tracking-[0.4em] text-[#4de1c1]">INFINITY X INTELLIGENCE ENGINE</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl sm:text-5xl">DATABASE HACKED</h1>
        <p className="text-[#7ee8ff] tracking-[0.25em] mt-1">BY INFINITY X</p>
        <div className="mx-auto mt-8 h-px w-64 overflow-hidden bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-[#4de1c1] to-[#7ee8ff]"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          />
        </div>
        <p className="mt-6 font-mono text-sm text-[#9bb0c0] terminal-caret">{STAGES[stage]}</p>
        <p className="mt-8 text-[10px] tracking-[0.3em] text-[#7f93a3]">AUTHORIZED TRAINING ENVIRONMENT</p>
      </motion.div>
    </div>
  )
}
