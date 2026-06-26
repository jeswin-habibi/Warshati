import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Wrench } from 'lucide-react'
import { useBusiness } from '@/features/businesses/useBusiness'
import { useJobs } from './api'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { StatusBadge } from '@/components/StatusBadge'
import { formatDate } from '@/lib/format'

export default function JobsPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data: business } = useBusiness()
  const { data: jobs, isLoading } = useJobs(business?.id ?? null)

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (jobs ?? []).length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">{t('jobs.empty')}</div>
      ) : (
        <ul className="space-y-2">
          {jobs!.map((j) => (
            <li key={j.id}>
              <button
                onClick={() => nav(`/jobs/${j.id}`)}
                className="tap flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-start active:bg-accent"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Wrench className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{j.customer?.name || t('jobs.walkIn')}</div>
                  <div className="truncate text-sm text-muted-foreground">
                    {j.vehicle?.plate_number || [j.vehicle?.make, j.vehicle?.model].filter(Boolean).join(' ') || formatDate(j.created_at)}
                  </div>
                </div>
                <StatusBadge status={j.status} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button onClick={() => nav('/jobs/new')} size="lg" className="fixed bottom-24 end-4 z-30 shadow-lg shadow-primary/30">
        <Plus className="h-6 w-6" /> {t('jobs.add')}
      </Button>
    </div>
  )
}
