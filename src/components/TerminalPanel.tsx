import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const LINES = [
  '> INITIALIZING OSINT ENGINE...',
  '> LOADING DATASET...',
  '> INDEX STATUS: ONLINE',
  '> SEARCH ENGINE: READY',
  '> GRAPH ENGINE: READY',
  '> INVESTIGATION MODULE: READY',
  '> SYSTEM STATUS: OPERATIONAL',
]

export function TerminalPanel() {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? LINES.length : 1)

  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => {
      setShown((n) => (n >= LINES.length ? n : n + 1))
    }, 240)
    return () => window.clearInterval(id)
  }, [reduce])

  return (
    <div className="glass rounded-2xl p-4 font-mono text-[12px] leading-6 text-[#9be8d4]">
      <div className="mb-2 flex items-center gap-2 text-[10px] tracking-[0.25em] text-[#7f93a3]">
        <span className="h-2 w-2 rounded-full bg-[#4de1c1]" />
        IX TERMINAL — VISUAL / EDUCATIONAL
      </div>
      {LINES.slice(0, shown).map((l) => (
        <motion.div key={l} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {l}
        </motion.div>
      ))}
      <p className="mt-3 text-[10px] text-[#7f93a3]">
        This panel does not execute system commands. Training simulation only.
      </p>
    </div>
  )
}
