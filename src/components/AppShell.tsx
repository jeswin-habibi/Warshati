import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Users, Wrench, Package, Menu, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SyncStatus } from '@/components/SyncStatus'
import { useBusiness } from '@/features/businesses/useBusiness'
import { useReminders } from '@/features/insights/api'

const tabs = [
  { to: '/', icon: Home, key: 'home', end: true },
  { to: '/customers', icon: Users, key: 'customers', end: false },
  { to: '/jobs', icon: Wrench, key: 'jobs', end: false },
  { to: '/inventory', icon: Package, key: 'inventory', end: false },
  { to: '/more', icon: Menu, key: 'more', end: false },
]

export function AppShell() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { data: business } = useBusiness()
  const { data: reminders } = useReminders(business?.id ?? null)
  const count = (reminders?.oil.length ?? 0) + (reminders?.maintenance.length ?? 0)

  return (
    <div className="app-shell-root mx-auto flex min-h-[100svh] max-w-md flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-border/60 bg-background/80 px-4 py-2.5 backdrop-blur-lg">
        <div className="flex items-center gap-2">
          <span className="gradient-primary flex h-9 w-9 items-center justify-center rounded-xl shadow-md shadow-primary/30">
            <Wrench className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">{t('app.name')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => nav('/reminders')}
            aria-label={t('reminders.title')}
            className="tap relative flex items-center justify-center rounded-xl p-1.5 text-muted-foreground active:bg-accent"
          >
            <Bell className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute end-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white">
                {count}
              </span>
            )}
          </button>
          <SyncStatus />
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md items-stretch justify-around border-t border-border/60 bg-background/85 px-1 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur-lg">
        {tabs.map(({ to, icon: Icon, key, end }) => (
          <NavLink key={key} to={to} end={end} className="tap flex flex-1 flex-col items-center justify-center gap-1 py-1">
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex h-9 w-12 items-center justify-center rounded-2xl transition-all',
                    isActive ? 'gradient-primary text-white shadow-md shadow-primary/30' : 'text-muted-foreground',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className={cn('text-[10px] font-bold', isActive ? 'text-primary' : 'text-muted-foreground')}>
                  {t(`nav.${key}`)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
