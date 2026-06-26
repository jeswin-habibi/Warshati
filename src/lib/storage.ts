import { supabase } from '@/lib/supabase'

const BUCKET = 'media'

function yearMonth() {
  const d = new Date()
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Upload a blob under <business_id>/<yyyy>/<mm>/<uuid>.<ext>; returns the storage path. */
export async function uploadMedia(businessId: string, blob: Blob, ext: string): Promise<string> {
  const path = `${businessId}/${yearMonth()}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || undefined,
    upsert: false,
  })
  if (error) throw error
  return path
}

export async function signedUrl(path: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn)
  if (error) return null
  return data.signedUrl
}

export async function removeMedia(path: string) {
  await supabase.storage.from(BUCKET).remove([path])
}
