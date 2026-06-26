import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { formatMoney } from '@/lib/format'

export default function HomePage() {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-sm font-semibold text-muted-foreground">{t('home.todayRevenue')}</p>
          <p className="stat-number mt-1 text-primary">{formatMoney(0)}</p>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground">{t('home.comingSoon')}</p>
    </div>
  )
}
