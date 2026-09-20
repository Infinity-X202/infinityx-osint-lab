import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatedBackground } from '@/components/AnimatedBackground'
import { SearchScanner } from '@/components/SearchScanner'
import { SearchSuggest } from '@/components/SearchSuggest'
import { PrimaryButton } from '@/components/ui'
import { useIntel } from '@/context/IntelContext'
import { suggestionsFor } from '@/lib/search'

const QUICK = [
  { label: 'Name', example: 'MUHAMMAD ASLAM' },
  { label: 'Number', example: '00923212423862' },
  { label: 'CNIC', example: '3320213987869' },
  { label: 'NADRA', example: 'Rayan Rasheed' },
  { label: 'City', example: 'Lahore' },
  { label: 'Business', example: 'Metro Pakistan' },
]

export function LandingPage() {
  const nav = useNavigate()
  const reduce = useReducedMotion()
  const { records } = useIntel()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [scanning, setScanning] = useState(false)
  const suggestions = useMemo(() => suggestionsFor(records, q, 8), [q, records])

  function runSearch(query: string) {
    const next = query.trim()
    if (!next) return
    setScanning(true)
    window.setTimeout(() => {
      nav(`/app/search?q=${encodeURIComponent(next)}`)
      setScanning(false)
    }, reduce ? 0 : 1400)
  }

  useEffect(() => {
    if (!q.trim()) setScanning(false)
  }, [q])

  return (
    <div className="relative min-h-svh overflow-x-hidden overflow-y-auto scanlines bg-[#020508]">
      <AnimatedBackground />
      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6">
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg sm:text-xl">INFINITY X</p>
          <p className="text-[10px] tracking-[0.28em] text-[#7ee8ff]">OSINT LAB · ONLINE</p>
        </div>
        <button
          type="button"
          onClick={() => nav('/app/search')}
          className="rounded-full border border-white/15 px-4 py-1.5 text-xs text-[#9bb0c0] hover:border-[#7ee8ff]/40"
        >
          Open dashboard
        </button>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100svh-80px)] max-w-3xl flex-col items-center justify-center px-4 pb-12 pt-6 text-center">
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-[family-name:var(--font-display)] text-4xl leading-tight sm:text-6xl"
        >
          DATABASE HACKED
        </motion.h1>
        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-2 bg-gradient-to-r from-[#4de1c1] to-[#7ee8ff] bg-clip-text text-lg tracking-[0.3em] text-transparent sm:text-2xl"
        >
          BY INFINITY X
        </motion.p>
        <p className="mt-4 text-sm text-[#9bb0c0]">
          OSINT search · name · CNIC · mobile · city · business · NADRA + PDF
        </p>

        <AnimatePresence mode="wait">
          {scanning ? (
            <motion.div key="scan" className="mt-8 w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SearchScanner query={q.trim()} />
            </motion.div>
          ) : (
            <motion.form
              key="form"
              className="mt-8 w-full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={(e) => {
                e.preventDefault()
                runSearch(q)
              }}
            >
              <div className="glow-border relative rounded-2xl border border-[#7ee8ff]/25 bg-[#071018]/85 p-2 backdrop-blur-xl">
                <input
                  value={q}
                  autoComplete="off"
                  onFocus={() => setOpen(true)}
                  onBlur={() => window.setTimeout(() => setOpen(false), 120)}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Type name, phone number, CNIC or business..."
                  className="w-full rounded-xl bg-transparent px-4 py-4 text-base sm:text-lg outline-none placeholder:text-[#6f8494]"
                />
                {open && q.trim() ? (
                  <SearchSuggest
                    items={suggestions}
                    query={q}
                    onPick={(item) => runSearch(item.value)}
                  />
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {QUICK.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    className="quick-chip rounded-full border border-white/10 px-3 py-1.5 text-xs text-[#9bb0c0]"
                    onClick={() => {
                      setQ(chip.example)
                      runSearch(chip.example)
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <PrimaryButton type="submit" className="w-full sm:w-auto px-12 py-3 text-sm tracking-[0.2em]">
                  SEARCH DATABASE
                </PrimaryButton>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="mt-10 text-[10px] tracking-wide text-[#7f93a3]">
          Indexed sources: my files.pdf (83) + NADRA GitHub demo (16) · Authorized OSINT training
        </p>
      </main>
    </div>
  )
}
