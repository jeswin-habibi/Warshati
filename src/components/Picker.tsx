import { useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface PickerProps<T> {
  value: T | null
  onChange: (v: T | null) => void
  items: T[]
  getKey: (t: T) => string
  getLabel: (t: T) => string
  getSub?: (t: T) => string | undefined
  placeholder: string
  searchPlaceholder?: string
  allowClear?: boolean
  clearLabel?: string
  filter?: (t: T, q: string) => boolean
}

export function Picker<T>({
  value, onChange, items, getKey, getLabel, getSub,
  placeholder, searchPlaceholder, allowClear, clearLabel, filter,
}: PickerProps<T>) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const list = query && filter ? items.filter((t) => filter(t, query)) : items

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="tap flex w-full items-center justify-between gap-2 rounded-2xl border border-input bg-card px-4 py-3 text-start text-base"
      >
        <span className={cn('truncate', !value && 'text-muted-foreground')}>{value ? getLabel(value) : placeholder}</span>
        <ChevronDown className={cn('h-5 w-5 shrink-0 text-muted-foreground transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          {filter && (
            <div className="relative border-b border-border p-2">
              <Search className="pointer-events-none absolute start-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder} className="ps-10" />
            </div>
          )}
          <div className="max-h-64 overflow-auto">
            {allowClear && (
              <button
                type="button"
                onClick={() => { onChange(null); setOpen(false); setQ('') }}
                className="block w-full px-4 py-3 text-start font-semibold text-muted-foreground"
              >
                {clearLabel}
              </button>
            )}
            {list.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">—</div>
            ) : (
              list.map((t) => (
                <button
                  key={getKey(t)}
                  type="button"
                  onClick={() => { onChange(t); setOpen(false); setQ('') }}
                  className="block w-full border-t border-border px-4 py-3 text-start"
                >
                  <div className="font-semibold">{getLabel(t)}</div>
                  {getSub?.(t) && <div className="text-sm text-muted-foreground">{getSub(t)}</div>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
