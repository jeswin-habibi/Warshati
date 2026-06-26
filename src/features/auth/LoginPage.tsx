import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
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
    <div className="mx-auto flex min-h-[100svh] max-w-md flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" className="mx-auto mb-4 h-16 w-16 rounded-3xl" />
        <h1 className="text-3xl font-extrabold">{t('app.name')}</h1>
        <p className="mt-1 text-muted-foreground">{t('app.tagline')}</p>
      </div>

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
        className="mt-5 text-center text-sm font-semibold text-primary"
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
      >
        {mode === 'signin' ? t('auth.noAccount') : t('auth.haveAccount')}
      </button>

      <p className="mt-8 text-center text-xs text-muted-foreground">{t('auth.phoneSoon')}</p>
    </div>
  )
}
