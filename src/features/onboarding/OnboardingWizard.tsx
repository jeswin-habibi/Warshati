import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import i18n, { LANGS, type Lang } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function OnboardingWizard({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [lang, setLang] = useState<Lang>((i18n.language as Lang) in LANGS ? (i18n.language as Lang) : 'ar')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function pickLang(l: Lang) {
    setLang(l)
    void i18n.changeLanguage(l)
  }

  async function create(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError(null)
    const { data: userRes } = await supabase.auth.getUser()
    const uid = userRes.user?.id
    // Generate the id client-side so we don't depend on INSERT…RETURNING — RLS would filter the
    // returned row because the user isn't a member of the business until the next insert.
    const businessId = crypto.randomUUID()
    const { error: e1 } = await supabase
      .from('businesses')
      .insert({ id: businessId, name: name.trim(), currency: 'KWD', language: lang })
    if (e1) {
      setBusy(false)
      setError(e1.message)
      return
    }
    const { error: e2 } = await supabase
      .from('business_users')
      .insert({ business_id: businessId, user_id: uid, role: 'owner' })
    setBusy(false)
    if (e2) {
      setError(e2.message)
      return
    }
    onDone()
  }

  return (
    <div className="mx-auto flex min-h-[100svh] max-w-md flex-col px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold">{t('onboarding.welcome')}</h1>
        <p className="mt-1 text-muted-foreground">{t('onboarding.welcomeSub')}</p>
      </div>

      <form onSubmit={create} className="flex flex-1 flex-col">
        <div className="space-y-5">
          <div>
            <Label>{t('onboarding.language')}</Label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(LANGS) as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => pickLang(l)}
                  className={`tap rounded-2xl border-2 py-4 text-lg font-bold transition ${
                    lang === l ? 'border-primary bg-accent text-accent-foreground' : 'border-input bg-card'
                  }`}
                >
                  {LANGS[l].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>{t('onboarding.businessName')}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('onboarding.businessNamePlaceholder')}
              autoFocus
              required
            />
          </div>

          <div>
            <Label>{t('onboarding.currency')}</Label>
            <Input value="KWD · د.ك" readOnly dir="ltr" className="opacity-70" />
          </div>

          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
        </div>

        <Button type="submit" size="lg" className="mt-auto w-full" disabled={busy || !name.trim()}>
          {busy ? t('onboarding.creating') : t('onboarding.create')}
        </Button>
      </form>
    </div>
  )
}
