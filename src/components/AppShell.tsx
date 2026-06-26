import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Users, Wrench, Package, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SyncStatus } from '@/components/SyncStatus'

const tabs = [
  { to: '/', icon: Home, key: 'home', end: true },
  { to: '/customers', icon: Users, key: 'customers', end: false },
  { to: '/jobs', icon: Wrench, key: 'jobs', end: false },
  { to: '/inventory', icon: Package, key: 'inventory', end: false },
  { to: '/more', icon: Menu, key: 'more', end: false },
]

export function AppShell() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto flex min-h-[100svh] max-w-md flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-border bg-card/80 px-4 py-3 backdrop-blur">
        <div className="text-lg font-extrabold">{t('app.name')}</div>
        <SyncStatus />
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md items-stretch justify-around border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        {tabs.map(({ to, icon: Icon, key, end }) => (
          <NavLink
            key={key}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'tap flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-semibold text-muted-foreground transition',
                isActive && 'text-primary',
              )
            }
          >
            <Icon className="h-6 w-6" />
            {t(`nav.${key}`)}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
