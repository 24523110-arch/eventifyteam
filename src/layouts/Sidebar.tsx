import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Music4, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { NAV_BY_ROLE } from './navConfig'
import { cn } from '@/utils'

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)

  if (!user) return null
  const navItems = NAV_BY_ROLE[user.role]

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const content = (
    <>
      <div className="flex items-center justify-between px-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-neon-gradient shadow-glow-sm">
            <Music4 className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-display font-bold tracking-tight">EVENTIFY</span>
        </div>
        <button onClick={onMobileClose} className="lg:hidden p-1.5 rounded-lg hover:bg-white/[0.06] text-ink-faint">
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin space-y-1 pr-1">
        {navItems.map((item, i) => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
          >
            <NavLink
              to={item.to}
              onClick={onMobileClose}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-neon-gradient text-white shadow-glow-sm'
                    : 'text-ink-faint hover:text-ink hover:bg-white/[0.05]'
                )
              }
            >
              <item.icon className="w-4 h-4 shrink-0" strokeWidth={2} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          </motion.div>
        ))}
      </nav>

      <div className="pt-3 mt-3 border-t border-white/[0.06] space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-7 h-7 rounded-full bg-neon-gradient flex items-center justify-center text-xs font-bold shrink-0">
            {user.avatarInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-ink truncate">{user.name}</div>
            <div className="text-xs text-ink-faint truncate capitalize">{user.role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-faint hover:text-status-danger hover:bg-status-danger/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 glass border-r border-white/[0.06] px-3 py-5">
        {content}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 z-40 bg-surface-void/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 left-0 z-50 flex flex-col w-72 h-screen glass border-r border-white/[0.06] px-3 py-5 lg:hidden"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
