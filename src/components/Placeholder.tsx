import { useTranslation } from 'react-i18next'

export function Placeholder({ title }: { title: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-2xl font-extrabold">{title}</h1>
      <p className="mt-2 text-muted-foreground">{t('home.comingSoon')}</p>
    </div>
  )
}
