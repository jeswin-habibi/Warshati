import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const STYLES: Record<string, string> = {
  estimate: 'bg-secondary text-secondary-foreground',
  in_progress: 'bg-amber-500/15 text-amber-600',
  completed: 'bg-success/15 text-success',
  cancelled: 'bg-destructive/15 text-destructive',
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold', STYLES[status] ?? 'bg-secondary')}>
      {t(`jobs.status.${status}`)}
    </span>
  )
}
