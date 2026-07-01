import { useState, useRef, useEffect } from 'react'
import { Bell, ChevronDown, Menu, CheckCheck, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { StatusBadge } from '@/components/StatusBadge'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 11) return 'Good Morning'
  if (hour < 15) return 'Good Afternoon'
  return 'Good Evening'
}

interface NavbarProps {
  onMobileMenuOpen: () => void
}

export function Navbar({ onMobileMenuOpen }: NavbarProps) {
  const [notifOpen, setNotifOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((s) => s.user)
  const notifications = useNotificationStore((s) => s.notifications)
  const markAsRead = useNotificationStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead)
  const clearAll = useNotificationStore((s) => s.clearAll)
  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  return (
    <header className="sticky top-0 z-30 glass border-b border-white/[0.06] px-4 sm:px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-white/[0.06] text-ink-muted shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm sm:text-base font-display font-semibold text-ink truncate">
          {getGreeting()}, <span className="text-gradient">{user.name.split(' ')[0]}</span>
        </h1>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-danger/15 border border-status-danger/30 shrink-0">
          <span className="live-dot" />
          <span className="text-xs font-bold text-status-danger tracking-wide">LIVE</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative p-2 rounded-xl glass hover:border-primary/30 transition-colors"
          >
            <Bell className="w-4 h-4 text-ink-muted" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-status-danger text-[10px] font-bold flex items-center justify-center text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 mt-2 w-80 glass-panel p-2 max-h-96 overflow-y-auto scrollbar-thin"
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs font-semibold text-ink-faint uppercase tracking-wider">
                    Notifications
                  </span>
                  {notifications.length > 0 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={markAllAsRead}
                        title="Mark all as read"
                        className="p-1.5 rounded-lg hover:bg-white/[0.06] text-ink-faint hover:text-primary transition-colors"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={clearAll}
                        title="Clear all"
                        className="p-1.5 rounded-lg hover:bg-white/[0.06] text-ink-faint hover:text-status-danger transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-ink-faint text-sm">No notifications.</div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/[0.05] transition-colors relative"
                    >
                      {!n.read && <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />}
                      <div className="flex items-start justify-between gap-2 pl-2">
                        <span className="text-sm font-medium text-ink">{n.title}</span>
                        <StatusBadge status={n.priority} className="shrink-0 !px-1.5 !py-0.5 !text-[10px]" />
                      </div>
                      <p className="text-xs text-ink-faint mt-0.5 pl-2">{n.message}</p>
                      <span className="text-[10px] text-ink-faint/70 pl-2">{n.time}</span>
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button className="flex items-center gap-2 p-1 pr-2 rounded-xl glass hover:border-primary/30 transition-colors">
          <div className="w-7 h-7 rounded-full bg-neon-gradient flex items-center justify-center text-xs font-bold">
            {user.avatarInitials}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-ink-faint hidden sm:block" />
        </button>
      </div>
    </header>
  )
}
