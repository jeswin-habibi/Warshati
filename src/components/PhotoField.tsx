import { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { compressImage } from '@/hooks/useCamera'
import { uploadMedia, removeMedia } from '@/lib/storage'
import { Thumb } from './Thumb'

/** Single photo capture/upload (e.g. an inventory item photo). Stores a Storage path. */
export function PhotoField({
  businessId,
  value,
  onChange,
}: {
  businessId: string | null
  value: string | null
  onChange: (path: string | null) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function onFile(file: File) {
    if (!businessId) return
    setBusy(true)
    try {
      const blob = await compressImage(file)
      const path = await uploadMedia(businessId, blob, 'jpg')
      onChange(path)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function remove() {
    if (value && !/^(https?:|data:)/.test(value)) {
      try {
        await removeMedia(value)
      } catch {
        /* ignore */
      }
    }
    onChange(null)
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      {value ? (
        <div className="relative h-28 w-28">
          <Thumb path={value} />
          <button type="button" onClick={remove} aria-label="remove" className="absolute end-1 top-1 rounded-full bg-black/60 p-1 text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="tap flex h-28 w-28 items-center justify-center rounded-2xl border-2 border-dashed border-input text-muted-foreground"
        >
          {busy ? '…' : <Camera className="h-7 w-7" />}
        </button>
      )}
    </div>
  )
}
