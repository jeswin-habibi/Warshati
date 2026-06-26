import { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { compressImage } from '@/hooks/useCamera'
import { uploadMedia, signedUrl, removeMedia } from '@/lib/storage'
import { useJobAttachments, useAddAttachment, useDeleteAttachment } from '@/features/jobs/api'
import { Thumb } from './Thumb'

export function PhotoGrid({ businessId, jobId, readOnly }: { businessId: string | null; jobId: string; readOnly?: boolean }) {
  const { data: atts } = useJobAttachments(jobId)
  const add = useAddAttachment(jobId)
  const del = useDeleteAttachment(jobId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const photos = (atts ?? []).filter((a) => a.type === 'photo')

  async function onFile(file: File) {
    if (!businessId) return
    setBusy(true)
    try {
      const blob = await compressImage(file)
      const path = await uploadMedia(businessId, blob, 'jpg')
      await add.mutateAsync({ url: path, type: 'photo', businessId })
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function view(path: string) {
    const url = await signedUrl(path)
    if (url) window.open(url, '_blank')
  }

  async function remove(id: string, path: string) {
    try {
      await removeMedia(path)
    } catch {
      /* ignore */
    }
    del.mutate(id)
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((p) => (
        <div key={p.id} className="relative aspect-square">
          <Thumb path={p.url} onClick={() => view(p.url)} />
          {!readOnly && (
            <button
              type="button"
              onClick={() => remove(p.id, p.url)}
              aria-label="delete"
              className="absolute end-1 top-1 rounded-full bg-black/60 p-1 text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
      {!readOnly && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="tap flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-input text-muted-foreground"
          >
            {busy ? '…' : <Camera className="h-6 w-6" />}
          </button>
        </>
      )}
    </div>
  )
}
