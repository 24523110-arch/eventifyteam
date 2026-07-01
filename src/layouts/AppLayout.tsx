import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { Toaster } from '@/components/Toaster'

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-surface-void">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Navbar onMobileMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 p-5 sm:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  )
}
