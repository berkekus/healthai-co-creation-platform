const API_ORIGIN = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api').replace(/\/api$/, '')

/** Photos the API stores are saved as paths on the API host; outside addresses are used as they are. */
export function resolveAvatarUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  return url.startsWith('/') ? `${API_ORIGIN}${url}` : url
}

/** Matches the server's cap; a shrunk photo is far below it. */
export const MAX_UPLOAD_BYTES = 512 * 1024
/** Largest original a person can pick: a phone camera photo, before it is shrunk. */
export const MAX_ORIGINAL_BYTES = 20 * 1024 * 1024

// Shown at most ~128 px, so 256 px stays sharp on high-density screens.
const AVATAR_SIDE = 256

interface Decoded {
  source: CanvasImageSource
  width: number
  height: number
  release: () => void
}

// Both paths follow the photo's EXIF orientation, so phone portraits are not turned on their side.
async function decode(file: Blob): Promise<Decoded> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() }
    } catch {
      // Older Safari rejects the options argument; an <img> still decodes the photo.
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    if (typeof img.decode !== 'function') throw new Error('Image decoding is not available')
    await img.decode()
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) }
  } catch (err) {
    URL.revokeObjectURL(url)
    throw err
  }
}

/** A square, centre-cropped JPEG of at most 256 px, as the profile circle shows it. */
export async function shrinkAvatar(file: Blob, side = AVATAR_SIDE): Promise<Blob> {
  const image = await decode(file)
  try {
    const crop = Math.min(image.width, image.height)
    if (crop === 0) throw new Error('The image has no pixels')
    const size = Math.min(side, crop)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not available')
    // JPEG has no transparency; a transparent PNG would otherwise turn black.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    ctx.drawImage(image.source, (image.width - crop) / 2, (image.height - crop) / 2, crop, crop, 0, 0, size, size)
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    if (!blob) throw new Error('Could not encode the image')
    return blob
  } finally {
    image.release()
  }
}

/**
 * The photo to upload: shrunk when the browser can, otherwise the original if
 * the server would still take it. `null` means neither works.
 */
export async function prepareAvatar(file: File): Promise<Blob | null> {
  try {
    return await shrinkAvatar(file)
  } catch {
    return file.size <= MAX_UPLOAD_BYTES ? file : null
  }
}
