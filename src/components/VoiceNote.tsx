import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mic, Square, Play, Trash2 } from 'lucide-react'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { uploadMedia, signedUrl, removeMedia } from '@/lib/storage'

export function VoiceNote({
  businessId,
  value,
  onChange,
  readOnly,
}: {
  businessId: string | null
  value: string | null
  onChange?: (path: string | null) => void
  readOnly?: boolean
}) {
  const { t } = useTranslation()
  const rec = useVoiceRecorder()
  const [busy, setBusy] = useState(false)

  async function toggle() {
    if (rec.recording) {
      rec.stop()
      return
    }
    await rec.start(async (blob) => {
      if (!businessId) return
      setBusy(true)
      try {
        const path = await uploadMedia(businessId, blob, 'webm')
        onChange?.(path)
      } finally {
        setBusy(false)
      }
    })
  }

  async function play() {
    if (!value) return
    const url = await signedUrl(value)
    if (url) void new Audio(url).play()
  }

  async function remove() {
    if (value) {
      try {
        await removeMedia(value)
      } catch {
        /* ignore */
      }
    }
    onChange?.(null)
  }

  if (value) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={play}
          className="tap flex items-center gap-2 rounded-2xl bg-accent px-4 py-2 font-semibold text-accent-foreground"
        >
          <Play className="h-5 w-5" />
          {t('media.playVoice')}
        </button>
        {!readOnly && (
          <button type="button" onClick={remove} aria-label="delete" className="tap p-2 text-destructive">
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>
    )
  }

  if (readOnly || !rec.supported) return null

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`tap flex items-center gap-2 rounded-2xl border-2 px-4 py-2 font-semibold ${
        rec.recording ? 'border-destructive bg-destructive/10 text-destructive' : 'border-input'
      }`}
    >
      {rec.recording ? (
        <>
          <Square className="h-5 w-5" />
          {rec.seconds}s
        </>
      ) : busy ? (
        t('common.loading')
      ) : (
        <>
          <Mic className="h-5 w-5" />
          {t('media.recordVoice')}
        </>
      )}
    </button>
  )
}
