import { useEffect, useState } from 'react'
import { signedUrl } from '@/lib/storage'

/** Renders a private Storage object via a short-lived signed URL. */
export function Thumb({ path, onClick }: { path: string; onClick?: () => void }) {
  const direct = /^(https?:|data:)/.test(path)
  const [url, setUrl] = useState<string | null>(direct ? path : null)

  useEffect(() => {
    if (direct) return
    let active = true
    void signedUrl(path).then((u) => {
      if (active) setUrl(u)
    })
    return () => {
      active = false
    }
  }, [path, direct])

  return (
    <div onClick={onClick} className="block h-full w-full overflow-hidden rounded-xl bg-muted">
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full animate-pulse" />
      )}
    </div>
  )
}
