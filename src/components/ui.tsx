import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function GlassCard({
  children,
  className,
  hover = true,
}: {
  children: React.ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <div
      className={cn(
        'glass rounded-2xl p-5',
        hover && 'transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(77,225,193,0.08)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Badge({ children, tone = 'mint' }: { children: React.ReactNode; tone?: 'mint' | 'cyan' | 'amber' | 'danger' }) {
  const map = {
    mint: 'text-[#4de1c1] border-[#4de1c1]/30 bg-[#4de1c1]/10',
    cyan: 'text-[#7ee8ff] border-[#7ee8ff]/30 bg-[#7ee8ff]/10',
    amber: 'text-[#e8c07a] border-[#e8c07a]/30 bg-[#e8c07a]/10',
    danger: 'text-[#ff7b7b] border-[#ff7b7b]/30 bg-[#ff7b7b]/10',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide', map[tone])}>
      {children}
    </span>
  )
}

export function AnimatedCounter({ value }: { value: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setN(value)
      return
    }
    const start = performance.now()
    const dur = 900
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(value * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span>{new Intl.NumberFormat('en-US').format(n)}</span>
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <GlassCard className="text-center py-16">
      <p className="font-[family-name:var(--font-display)] text-2xl tracking-wide">NO INTELLIGENCE FOUND</p>
      <p className="mt-2 text-sm text-[#7f93a3]">{title}</p>
      <p className="mt-3 max-w-lg mx-auto text-[#9bb0c0]">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </GlassCard>
  )
}

export function ErrorBanner({
  title = 'SEARCH ERROR',
  body,
  onRetry,
}: {
  title?: string
  body: string
  onRetry?: () => void
}) {
  return (
    <div className="rounded-xl border border-[#ff7b7b]/30 bg-[#ff7b7b]/10 px-4 py-3 flex items-center justify-between gap-4">
      <div>
        <p className="text-[#ff9b9b] text-sm font-semibold tracking-wider">{title}</p>
        <p className="text-sm text-[#d7e4ee] mt-1">{body}</p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-[#ff7b7b]/40 px-3 py-1.5 text-sm hover:bg-[#ff7b7b]/10"
        >
          Retry
        </button>
      ) : null}
    </div>
  )
}

export function SkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton h-28 rounded-2xl" />
      ))}
    </div>
  )
}

export function PrimaryButton({
  children,
  onClick,
  type = 'button',
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl bg-gradient-to-r from-[#4de1c1] to-[#7ee8ff] px-5 py-2.5 text-sm font-semibold text-[#052018] shadow-[0_0_24px_rgba(77,225,193,0.25)] transition hover:brightness-110',
        className,
      )}
    >
      {children}
    </button>
  )
}
