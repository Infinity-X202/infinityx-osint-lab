import { NavLink, useLocation } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  Database,
  FileText,
  FolderSearch,
  GitBranch,
  LayoutDashboard,
  Search,
  Settings,
  Shield,
  DatabaseZap,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const LINKS = [
  { to: '/app', label: 'Search', icon: Search, end: true },
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/investigations', label: 'Investigations', icon: FolderSearch },
  { to: '/app/graph', label: 'Intelligence Graph', icon: GitBranch },
  { to: '/app/osint', label: 'OSINT Module', icon: Shield },
  { to: '/app/nadra', label: 'NADRA Module', icon: DatabaseZap },
  { to: '/app/my-files-pdf', label: 'my files.pdf', icon: FileText },
  { to: '/app/sources', label: 'Sources', icon: Activity },
  { to: '/app/datasets', label: 'Dataset Explorer', icon: Database },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/reports', label: 'Reports', icon: FileText },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const loc = useLocation()
  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={cn(
          'fixed z-50 flex h-svh w-[270px] flex-col border-r border-[rgba(125,211,224,0.16)] bg-[#071018]/95 backdrop-blur-xl transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg leading-none">INFINITY X</p>
            <p className="mt-1 text-[10px] tracking-[0.28em] text-[#7ee8ff]">OSINT LAB</p>
          </div>
          <button type="button" className="lg:hidden" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {LINKS.map((l) => {
            const Icon = l.icon
            const active = l.end ? loc.pathname === l.to : loc.pathname.startsWith(l.to)
            return (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#9bb0c0] transition',
                  active && 'bg-[#4de1c1]/10 text-[#e8f8ff] glow-border',
                )}
              >
                <Icon size={16} />
                {l.label}
              </NavLink>
            )
          })}
        </nav>
        <p className="px-5 py-4 text-[10px] leading-5 text-[#7f93a3]">
          Database Hacked by Infinity X
          <br />
          Created by Infinity X
          <br />
          Training / authorized use only
        </p>
      </aside>
    </>
  )
}
