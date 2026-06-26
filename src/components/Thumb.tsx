import { useEffect, useState } from 'react'
import { signedUrl } from '@/lib/storage'

/** Renders a private Storage object via a short-lived signed URL. */
export function Thumb({ path, onClick }: { path: string; onClick?: () => void }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void signedUrl(path).then((u) => {
      if (active) setUrl(u)
    })
    return () => {
      active = false
    }
  }, [path])

  return (
    <button type="button" onClick={onClick} className="block h-full w-full overflow-hidden rounded-xl">
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full animate-pulse bg-muted" />
      )}
    </button>
  )
}
