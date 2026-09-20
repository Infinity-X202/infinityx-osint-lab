import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const STEPS = [
  'CONNECTING TO INDEX...',
  'SCANNING MY FILES.PDF...',
  'SCANNING NADRA / GITHUB...',
  'MATCHING CNIC / MOBILE / NAME...',
  'BUILDING OSINT DOSSIER...',
]

export function SearchScanner({ query }: { query: string }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    setStep(0)
    const id = window.setInterval(() => {
      setStep((s) => (s >= STEPS.length - 1 ? s : s + 1))
    }, 320)
    return () => window.clearInterval(id)
  }, [query])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="glass relative overflow-hidden rounded-2xl p-8 text-center"
    >
      <div className="scanner-beam absolute inset-x-0 top-0 h-24 opacity-30" />
      <div className="relative mx-auto mb-6 h-24 w-24">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-[#4de1c1]/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border border-[#7ee8ff]/40 border-t-transparent"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="h-3 w-3 rounded-full bg-[#4de1c1]"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
      </div>
      <p className="font-[family-name:var(--font-display)] text-xl tracking-wide">SEARCHING DATABASE</p>
      <p className="mt-2 text-sm text-[#7ee8ff]">Query: {query}</p>
      <motion.p
        key={step}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 font-mono text-xs tracking-[0.25em] text-[#4de1c1] terminal-caret"
      >
        {STEPS[step]}
      </motion.p>
      <div className="mx-auto mt-6 h-1 max-w-xs overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full bg-gradient-to-r from-[#4de1c1] to-[#7ee8ff]"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
      </div>
    </motion.div>
  )
}
