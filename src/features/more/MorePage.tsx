import { useTranslation } from 'react-i18next'
import i18n, { LANGS, type Lang } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function MorePage() {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <Card>
        <CardContent>
          <p className="mb-2 text-sm font-semibold text-muted-foreground">{t('onboarding.language')}</p>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(LANGS) as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => void i18n.changeLanguage(l)}
                className={`tap rounded-2xl border-2 py-3 font-bold transition ${
                  i18n.language === l ? 'border-primary bg-accent text-accent-foreground' : 'border-input'
                }`}
              >
                {LANGS[l].label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button variant="destructive" size="lg" className="w-full" onClick={() => void supabase.auth.signOut()}>
        {t('auth.signOut')}
      </Button>
    </div>
  )
}
