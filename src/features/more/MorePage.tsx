import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Receipt, CalendarCheck, ChevronLeft, LogOut, MessageCircle, Wallet, TrendingUp, Bell } from 'lucide-react'
import i18n, { LANGS, type Lang } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { useBusiness } from '@/features/businesses/useBusiness'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function MorePage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data: business } = useBusiness()

  const menu = [
    { to: '/reminders', icon: Bell, label: t('reminders.title') },
    { to: '/follow-ups', icon: MessageCircle, label: t('insights.followUps') },
    { to: '/money-owed', icon: Wallet, label: t('insights.moneyOwed') },
    { to: '/profit', icon: TrendingUp, label: t('insights.profit') },
    { to: '/expenses', icon: Receipt, label: t('expenses.title') },
    { to: '/daily-close', icon: CalendarCheck, label: t('dailyClose.title') },
  ]

  return (
    <div className="space-y-4">
      {business && <h1 className="px-1 text-2xl font-extrabold">{business.name}</h1>}

      <Card>
        <CardContent className="p-0">
          {menu.map((m, idx) => (
            <button
              key={m.to}
              onClick={() => nav(m.to)}
              className={`tap flex w-full items-center gap-3 px-4 py-4 text-start ${idx > 0 ? 'border-t border-border' : ''}`}
            >
              <m.icon className="h-5 w-5 text-primary" />
              <span className="flex-1 font-semibold">{m.label}</span>
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </CardContent>
      </Card>

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
        <LogOut className="h-5 w-5" />
        {t('auth.signOut')}
      </Button>
    </div>
  )
}
