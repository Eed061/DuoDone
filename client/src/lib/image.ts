/**
 * iOS-safe client-side image compression.
 *  - Decodes via <img> (iOS 13.4+ applies EXIF orientation automatically when drawing an <img> to canvas).
 *  - Downscales so the longest side ≤ maxSide → the canvas stays far below iOS canvas memory limits (16.7 MP).
 *  - Explicitly frees canvas memory and object URLs afterwards (iOS is very sensitive to leaks).
 */
export async function compressImage(file: File | Blob, maxSide = 1200, quality = 0.8): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const w0 = img.naturalWidth || img.width;
    const h0 = img.naturalHeight || img.height;
    if (!w0 || !h0) throw new Error('decode_failed');
    const scale = Math.min(1, maxSide / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no_canvas');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    // release memory (important on iOS)
    canvas.width = 0;
    canvas.height = 0;
    img.src = '';
    if (!blob) throw new Error('encode_failed');
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode_failed'));
    img.src = src;
  });
}

/** Compresses; if the browser can't decode the format, falls back to the original file (if it isn't huge). */
export async function prepareImage(file: File): Promise<Blob> {
  try {
    return await compressImage(file);
  } catch (e) {
    if (file.size <= 8 * 1024 * 1024 && /^image\//.test(file.type)) return file;
    throw e;
  }
}
