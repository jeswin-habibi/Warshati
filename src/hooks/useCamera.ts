import imageCompression from 'browser-image-compression'

// Compress a captured photo to ~200KB before upload (design principle: small media).
export async function compressImage(file: File): Promise<Blob> {
  try {
    return await imageCompression(file, {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
    })
  } catch {
    return file
  }
}
