export interface CompressOptions {
  /** Output size limit in bytes. Default: 1 MB. */
  maxBytes?: number;
  /** Longest side of the output image in pixels. Default: 2048. */
  maxDimension?: number;
  /** First WebP quality to try (0-1). Default: 0.85. */
  initialQuality?: number;
  /** Never go below this quality before shrinking the dimensions instead. Default: 0.5. */
  minQuality?: number;
}

const ONE_MB = 1024 * 1024;

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  // imageOrientation applies EXIF rotation so phone photos aren't sideways.
  return createImageBitmap(file, { imageOrientation: 'from-image' });
}

/**
 * Compresses an image in the browser to WebP and keeps it under `maxBytes`
 * (1 MB by default). It lowers the quality first, then shrinks the dimensions,
 * so large photos still end up under the limit. Run this before uploading to
 * Firebase Storage to save bandwidth.
 *
 * Browser only (uses Canvas); call it from client components / event handlers.
 */
export async function compressImageToWebP(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxBytes = ONE_MB,
    maxDimension = 2048,
    initialQuality = 0.85,
    minQuality = 0.5,
  } = options;

  if (typeof document === 'undefined') {
    throw new Error('compressImageToWebP can only run in the browser.');
  }
  if (!file.type.startsWith('image/')) {
    throw new Error(`"${file.name}" is not an image.`);
  }

  const bitmap = await loadBitmap(file);
  try {
    let scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));

    // Shrink up to 6 times; each pass tries qualities from high to low.
    for (let pass = 0; pass < 6; pass++) {
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas is not available in this browser.');
      ctx.drawImage(bitmap, 0, 0, width, height);

      for (let quality = initialQuality; quality >= minQuality - 1e-6; quality -= 0.1) {
        const blob = await canvasToBlob(canvas, quality);
        if (!blob) throw new Error('Could not encode the image.');
        if (blob.type !== 'image/webp') {
          throw new Error('This browser cannot encode WebP images.');
        }
        if (blob.size <= maxBytes) {
          return toFile(blob, file.name);
        }
      }

      scale *= 0.8; // still too big at minimum quality: reduce dimensions and retry
    }

    throw new Error(
      `Could not compress "${file.name}" below ${(maxBytes / ONE_MB).toFixed(1)} MB.`
    );
  } finally {
    bitmap.close();
  }
}

/** Compresses several photos, preserving order. */
export function compressImages(files: File[], options?: CompressOptions): Promise<File[]> {
  return Promise.all(files.map((f) => compressImageToWebP(f, options)));
}

function toFile(blob: Blob, originalName: string): File {
  const baseName = originalName.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${baseName}.webp`, {
    type: 'image/webp',
    lastModified: Date.now(),
  });
}
