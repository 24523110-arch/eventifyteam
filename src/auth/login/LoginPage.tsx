import { useRef } from 'react'
import { SplashSection } from './SplashSection'
import { LoginFormSection } from './LoginFormSection'

export function LoginPage() {
  const formRef = useRef<HTMLDivElement>(null)

  function scrollToLogin() {
    document.getElementById('login-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="w-full bg-surface-void overflow-y-auto h-screen scroll-smooth" ref={formRef}>
      <SplashSection onScrollToLogin={scrollToLogin} />
      <LoginFormSection />
    </div>
  )
}
