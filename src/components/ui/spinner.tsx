export function Spinner({ className = '' }: { className?: string }) {
  return <div className={`h-7 w-7 animate-spin rounded-full border-2 border-muted border-t-primary ${className}`} />
}
