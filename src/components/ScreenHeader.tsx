import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export function ScreenHeader({ title, action }: { title: string; action?: ReactNode }) {
  const nav = useNavigate()
  return (
    <div className="mb-4 flex items-center gap-1">
      <button
        type="button"
        onClick={() => nav(-1)}
        aria-label="back"
        className="tap -ms-2 flex items-center justify-center rounded-xl p-2 text-muted-foreground active:bg-accent"
      >
        <ChevronLeft className="h-6 w-6 rtl:rotate-180" />
      </button>
      <h1 className="flex-1 truncate text-xl font-extrabold">{title}</h1>
      {action}
    </div>
  )
}
