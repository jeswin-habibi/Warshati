import { useRef, useState } from 'react'

// MediaRecorder → webm/opus, with a hard cap (default 60s). Capacitor-safe: callers should
// hide the control when `supported` is false (older webviews) rather than break.
export function useVoiceRecorder(maxMs = 60000) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const recRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<number | null>(null)

  const supported =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices && typeof MediaRecorder !== 'undefined'

  async function start(onDone: (blob: Blob) => void) {
    if (!supported) return
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const chunks: Blob[] = []
    const rec = new MediaRecorder(stream)
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data)
    }
    rec.onstop = () => {
      stream.getTracks().forEach((tr) => tr.stop())
      if (timerRef.current) window.clearInterval(timerRef.current)
      setRecording(false)
      setSeconds(0)
      onDone(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }))
    }
    recRef.current = rec
    rec.start()
    setRecording(true)
    setSeconds(0)
    timerRef.current = window.setInterval(() => {
      setSeconds((s) => {
        const next = s + 1
        if (next * 1000 >= maxMs) rec.stop()
        return next
      })
    }, 1000)
  }

  function stop() {
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop()
  }

  return { supported, recording, seconds, start, stop }
}
