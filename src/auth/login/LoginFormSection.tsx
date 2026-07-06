import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ChevronDown, Check, Music4, AlertCircle, BarChart3, CalendarClock, Shield } from 'lucide-react'
import { useReferenceStore } from '@/store/referenceStore'
import { useAuthStore, ROLE_TO_DASHBOARD } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import type { UserRole } from '@/types'
import { cn, isValidEmail, isValidPassword } from '@/utils'

interface FieldErrors {
  email?: string
  password?: string
}

// Demo-only quick-login shortcuts. These credentials exist as dummy rows in
// the database (not seed.sql) — remove this block for a real deployment.
const DEMO_ACCOUNTS: { role: UserRole; label: string; icon: typeof BarChart3; email: string; password: string }[] = [
  { role: 'manager', label: 'Manager', icon: BarChart3, email: 'muhammad.wahyu.ramadhani@eventify.io', password: 'eventify123' },
  { role: 'admin', label: 'Admin / EO', icon: CalendarClock, email: 'budi.santoso@eventify.io', password: 'eventify123' },
  { role: 'security', label: 'Security', icon: Shield, email: 'siti.aisyah@eventify.io', password: 'eventify123' },
]

export function LoginFormSection() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const isLoading = useAuthStore((s) => s.isLoading)
  const authError = useAuthStore((s) => s.error)
  const clearError = useAuthStore((s) => s.clearError)
  const showToast = useToastStore((s) => s.show)
  const roleOptions = useReferenceStore((s) => s.roles)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [role, setRole] = useState<UserRole>('manager')
  const [roleOpen, setRoleOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState(false)
  const [demoLoading, setDemoLoading] = useState<UserRole | null>(null)

  const selectedRole = roleOptions.find((r) => r.value === role)

  function validate(): boolean {
    const errors: FieldErrors = {}
    if (!email.trim()) {
      errors.email = 'Email wajib diisi.'
    } else if (!isValidEmail(email)) {
      errors.email = 'Format email tidak valid.'
    }
    if (!password) {
      errors.password = 'Password wajib diisi.'
    } else if (!isValidPassword(password)) {
      errors.password = 'Password minimal 8 karakter.'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    clearError()
    if (!validate()) return

    const success = await login(email, password, role, remember)
    if (success) {
      showToast('Berhasil masuk. Mengarahkan ke dashboard…', 'success')
      navigate(ROLE_TO_DASHBOARD[role])
    }
  }

  async function handleDemoLogin(account: (typeof DEMO_ACCOUNTS)[number]) {
    clearError()
    setDemoLoading(account.role)
    const success = await login(account.email, account.password, account.role, true)
    setDemoLoading(null)
    if (success) {
      showToast(`Masuk sebagai demo ${account.label}.`, 'success')
      navigate(ROLE_TO_DASHBOARD[account.role])
    }
  }

  return (
    <section
      id="login-form"
      className="min-h-screen w-full flex items-center justify-center px-6 py-20 relative"
    >
      <div className="absolute inset-0 bg-grid-pattern bg-[size:32px_32px] opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md glass-panel p-8 sm:p-10"
      >
        <div className="flex items-center gap-2.5 mb-8">
          <div className="p-2 rounded-xl bg-neon-gradient shadow-glow-sm">
            <Music4 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-display font-bold tracking-tight">EVENTIFY</span>
        </div>

        <h2 className="text-2xl font-display font-bold mb-1">Welcome back</h2>
        <p className="text-ink-faint text-sm mb-7">Sign in to access your operations dashboard.</p>

        <AnimatePresence>
          {authError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 flex items-start gap-2 px-3.5 py-3 rounded-xl bg-status-danger/10 border border-status-danger/30 overflow-hidden"
            >
              <AlertCircle className="w-4 h-4 text-status-danger shrink-0 mt-0.5" />
              <p className="text-sm text-status-danger">{authError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="text-xs font-medium text-ink-muted mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (touched) validate()
                }}
                className={cn('input-glass pl-10', touched && fieldErrors.email && 'border-status-danger/60')}
                placeholder="you@eventify.io"
              />
            </div>
            {touched && fieldErrors.email && <p className="text-xs text-status-danger mt-1.5">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-ink-muted mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (touched) validate()
                }}
                className={cn('input-glass pl-10 pr-10', touched && fieldErrors.password && 'border-status-danger/60')}
                placeholder="Minimal 8 karakter"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {touched && fieldErrors.password && <p className="text-xs text-status-danger mt-1.5">{fieldErrors.password}</p>}
          </div>

          <div className="relative">
            <label className="text-xs font-medium text-ink-muted mb-1.5 block">Role</label>
            <button
              type="button"
              onClick={() => setRoleOpen((o) => !o)}
              className="input-glass flex items-center justify-between text-left"
            >
              <span className="text-ink">{selectedRole?.label ?? 'Pilih role'}</span>
              <ChevronDown className={cn('w-4 h-4 text-ink-faint transition-transform', roleOpen && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {roleOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="absolute z-20 mt-2 w-full glass-panel p-2"
                >
                  {roleOptions.map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => {
                        setRole(opt.value)
                        setRoleOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-start gap-2 text-left px-3 py-2.5 rounded-lg hover:bg-glass/[0.06] transition-colors',
                        role === opt.value && 'bg-primary/10'
                      )}
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium text-ink">{opt.label}</div>
                        <div className="text-xs text-ink-faint">{opt.description}</div>
                      </div>
                      {role === opt.value && <Check className="w-4 h-4 text-primary mt-0.5" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between text-sm pt-1">
            <label className="flex items-center gap-2 text-ink-faint cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded accent-primary"
              />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading && (
              <motion.div
                className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
              />
            )}
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-7">
          <div className="flex items-center gap-3 text-xs text-ink-faint">
            <div className="h-px flex-1 bg-glass/10" />
            <span>Demo — masuk cepat sebagai</span>
            <div className="h-px flex-1 bg-glass/10" />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {DEMO_ACCOUNTS.map((account) => {
              const Icon = account.icon
              const loading = demoLoading === account.role
              return (
                <button
                  key={account.role}
                  type="button"
                  disabled={isLoading || demoLoading !== null}
                  onClick={() => handleDemoLogin(account)}
                  className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border border-glass/10 bg-glass/[0.04] text-ink-faint hover:text-ink hover:border-primary/40 hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <motion.div
                      className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                    />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span className="text-xs font-medium">{account.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
