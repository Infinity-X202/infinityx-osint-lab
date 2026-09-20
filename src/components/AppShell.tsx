import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import { useState } from 'react'

export function AppShell() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex min-h-svh">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
        <footer className="border-t border-white/5 px-4 py-4 text-center text-[11px] tracking-wide text-[#7f93a3]">
          Database Hacked by Infinity X · Created by Infinity X · OSINT Intelligence & Cybersecurity Research Laboratory · Authorized training environment
        </footer>
      </div>
    </div>
  )
}
