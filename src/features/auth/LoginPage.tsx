import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Wrench } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    setBusy(false)
    if (error) setError(error.message)
  }

  return (
    <div className="relative mx-auto flex min-h-[100svh] max-w-md flex-col overflow-hidden">
      <div className="gradient-primary pointer-events-none absolute inset-x-0 top-0 h-[44%] rounded-b-[2.5rem]" />

      <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-10">
        <div className="mb-7 text-center text-white">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-white/15 shadow-lg ring-1 ring-white/30 backdrop-blur">
            <Wrench className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">{t('app.name')}</h1>
          <p className="mt-1.5 text-white/85">{t('app.tagline')}</p>
        </div>

        <div className="rounded-[1.75rem] border border-border/60 bg-card p-6 shadow-lift">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>{t('auth.email')}</Label>
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>{t('auth.password')}</Label>
              <Input
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm font-semibold text-destructive">{t('auth.error')}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
            </Button>
          </form>

          <button
            type="button"
            className="mt-5 block w-full text-center text-sm font-semibold text-primary"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            {mode === 'signin' ? t('auth.noAccount') : t('auth.haveAccount')}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">{t('auth.phoneSoon')}</p>
      </div>
    </div>
  )
}
