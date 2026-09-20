import { Bell, Menu, Search, UserRound } from 'lucide-react'
import { useIntel } from '@/context/IntelContext'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '@/lib/utils'

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { notifications, settings } = useIntel()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const nav = useNavigate()

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[rgba(125,211,224,0.12)] bg-[#05080d]/80 px-4 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button type="button" className="rounded-lg border border-white/10 p-2 lg:hidden" onClick={onMenu} aria-label="Open menu">
          <Menu size={18} />
        </button>
        <div>
          <p className="text-xs tracking-[0.22em] text-[#7f93a3]">INFINITY X WORKSTATION</p>
          <p className="text-sm">OSINT Intelligence & Cybersecurity Research Laboratory</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <form
          className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 md:flex"
          onSubmit={(e) => {
            e.preventDefault()
            if (q.trim()) nav(`/app/search?q=${encodeURIComponent(q.trim())}`)
          }}
        >
          <Search size={14} className="text-[#7ee8ff]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search all sources..."
            className="w-44 bg-transparent text-xs outline-none lg:w-56"
          />
        </form>
        <div className="hidden items-center gap-2 rounded-full border border-[#4de1c1]/30 px-3 py-1 text-xs sm:flex">
          <span className="online-dot h-2 w-2 rounded-full bg-[#4de1c1]" />
          SYSTEM ONLINE
        </div>
        <div className="relative">
          <button
            type="button"
            className="rounded-lg border border-white/10 p-2"
            aria-label="Notifications"
            onClick={() => setOpen((v) => !v)}
          >
            <Bell size={16} />
          </button>
          {open ? (
            <div className="absolute right-0 mt-2 w-72 glass rounded-xl p-3 text-sm">
              {notifications.map((n) => (
                <div key={n.id} className="border-b border-white/5 py-2 last:border-0">
                  <p className="text-[#7ee8ff]">{n.title}</p>
                  <p className="text-[#9bb0c0]">{n.body}</p>
                  <p className="text-[10px] text-[#7f93a3] mt-1">{formatDate(n.at)}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs">
          <UserRound size={14} />
          {settings.investigatorName}
        </div>
      </div>
    </header>
  )
}
