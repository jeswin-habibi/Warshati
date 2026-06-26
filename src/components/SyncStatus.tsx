import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { cn } from '@/lib/utils'

export function SyncStatus() {
  const { t } = useTranslation()
  const online = useOnlineStatus()
  const busy = useIsFetching() + useIsMutating()
  const state = !online ? 'offline' : busy ? 'syncing' : 'synced'
  const dot = {
    offline: 'bg-muted-foreground',
    syncing: 'bg-amber-500 animate-pulse',
    synced: 'bg-success',
  }[state]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
      <span className={cn('h-2 w-2 rounded-full', dot)} />
      {t(`sync.${state}`)}
    </span>
  )
}
