import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Palette, Globe, Save } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useToastStore } from '@/store/toastStore'
import { GlassCard } from '@/components/GlassCard'
import { cn } from '@/utils'

interface ToggleRowProps {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <div className="text-sm font-medium text-ink">{label}</div>
        <div className="text-xs text-ink-faint mt-0.5">{description}</div>
      </div>
      <button
        onClick={onChange}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors shrink-0',
          checked ? 'bg-neon-gradient shadow-glow-sm' : 'bg-white/10'
        )}
      >
        <motion.span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
          animate={{ left: checked ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  )
}

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'language', label: 'Language & Region', icon: Globe },
]

const ROLE_LABEL: Record<string, string> = {
  manager: 'Manager',
  admin: 'Admin / Event Organizer',
  security: 'Security Team',
}

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile')
  const user = useAuthStore((s) => s.user)
  const showToast = useToastStore((s) => s.show)
  const {
    phone, notificationPrefs, reduceMotion, compactDensity, language, timezone,
    setPhone, toggleNotificationPref, setReduceMotion, setCompactDensity, setLanguage, setTimezone,
  } = useSettingsStore()

  const [phoneDraft, setPhoneDraft] = useState(phone)

  if (!user) return null

  function handleSaveProfile() {
    setPhone(phoneDraft)
    showToast('Profile updated.', 'success')
  }

  function handleSavePreferences() {
    showToast('Preferences saved.', 'success')
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-display font-bold text-ink">Settings</h1>
        <p className="text-ink-faint text-sm mt-1">Manage your account, notifications, and preferences.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <GlassCard delay={0.05} className="lg:col-span-1 h-fit" hover={false}>
          <nav className="space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  activeSection === s.id
                    ? 'bg-neon-gradient text-white shadow-glow-sm'
                    : 'text-ink-faint hover:text-ink hover:bg-white/[0.05]'
                )}
              >
                <s.icon className="w-4 h-4" />
                {s.label}
              </button>
            ))}
          </nav>
        </GlassCard>

        <div className="lg:col-span-3 space-y-6">
          {activeSection === 'profile' && (
            <GlassCard delay={0.1} hover={false}>
              <h2 className="font-display font-semibold text-ink mb-5">Profile Information</h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-neon-gradient flex items-center justify-center text-xl font-bold shadow-glow-sm">
                  {user.avatarInitials}
                </div>
                <div>
                  <div className="text-sm font-medium text-ink">{user.name}</div>
                  <div className="text-xs text-ink-faint">{ROLE_LABEL[user.role]}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-ink-muted mb-1.5 block">Full Name</label>
                  <input defaultValue={user.name} disabled className="input-glass opacity-60 cursor-not-allowed" />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted mb-1.5 block">Email</label>
                  <input defaultValue={user.email} disabled className="input-glass opacity-60 cursor-not-allowed" />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted mb-1.5 block">Role</label>
                  <input defaultValue={ROLE_LABEL[user.role]} disabled className="input-glass opacity-60 cursor-not-allowed" />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted mb-1.5 block">Phone</label>
                  <input value={phoneDraft} onChange={(e) => setPhoneDraft(e.target.value)} className="input-glass" />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={handleSaveProfile} className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </GlassCard>
          )}

          {activeSection === 'notifications' && (
            <GlassCard delay={0.1} hover={false}>
              <h2 className="font-display font-semibold text-ink mb-2">Notification Preferences</h2>
              <p className="text-xs text-ink-faint mb-2">Choose which real-time alerts you want to receive.</p>
              <div className="divide-y divide-white/[0.06]">
                <ToggleRow
                  label="Security Incidents"
                  description="Critical and high-severity incidents"
                  checked={notificationPrefs.securityIncidents}
                  onChange={() => toggleNotificationPref('securityIncidents')}
                />
                <ToggleRow
                  label="Revenue Milestones"
                  description="Ticket sales and revenue thresholds"
                  checked={notificationPrefs.revenueMilestones}
                  onChange={() => toggleNotificationPref('revenueMilestones')}
                />
                <ToggleRow
                  label="Crowd Threshold Alerts"
                  description="When a zone exceeds safe capacity"
                  checked={notificationPrefs.crowdThresholdAlerts}
                  onChange={() => toggleNotificationPref('crowdThresholdAlerts')}
                />
                <ToggleRow
                  label="Vendor Check-In Updates"
                  description="Vendor arrival and readiness status"
                  checked={notificationPrefs.vendorCheckInUpdates}
                  onChange={() => toggleNotificationPref('vendorCheckInUpdates')}
                />
                <ToggleRow
                  label="System Alerts"
                  description="Backend health and uptime warnings"
                  checked={notificationPrefs.systemAlerts}
                  onChange={() => toggleNotificationPref('systemAlerts')}
                />
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={handleSavePreferences} className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm">
                  <Save className="w-4 h-4" /> Save Preferences
                </button>
              </div>
            </GlassCard>
          )}

          {activeSection === 'appearance' && (
            <GlassCard delay={0.1} hover={false}>
              <h2 className="font-display font-semibold text-ink mb-5">Appearance</h2>
              <div className="divide-y divide-white/[0.06]">
                <ToggleRow
                  label="Reduce Motion"
                  description="Minimize animations across the dashboard"
                  checked={reduceMotion}
                  onChange={() => setReduceMotion(!reduceMotion)}
                />
                <ToggleRow
                  label="Compact Density"
                  description="Show more data with tighter spacing"
                  checked={compactDensity}
                  onChange={() => setCompactDensity(!compactDensity)}
                />
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={handleSavePreferences} className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm">
                  <Save className="w-4 h-4" /> Save Preferences
                </button>
              </div>
            </GlassCard>
          )}

          {activeSection === 'language' && (
            <GlassCard delay={0.1} hover={false}>
              <h2 className="font-display font-semibold text-ink mb-5">Language &amp; Region</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-ink-muted mb-1.5 block">Language</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value as 'id' | 'en')} className="input-glass">
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted mb-1.5 block">Timezone</label>
                  <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="input-glass">
                    <option value="wib">WIB (UTC+7) — Jakarta</option>
                    <option value="wita">WITA (UTC+8) — Makassar</option>
                    <option value="wit">WIT (UTC+9) — Jayapura</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={handleSavePreferences} className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm">
                  <Save className="w-4 h-4" /> Save Preferences
                </button>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  )
}
