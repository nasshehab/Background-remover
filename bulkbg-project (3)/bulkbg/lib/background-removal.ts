/**
 * Background removal wrapper using @imgly/background-removal
 * Handles batching, progress callbacks, and memory management.
 * All imports are dynamic (lazy) to avoid SSR/build issues with WASM.
 */

export interface RemovalOptions {
  quality: 'high' | 'ultra';
  onProgress?: (progress: number) => void;
}

/**
 * Remove background from a single image File.
 * Returns a PNG Blob with transparent background.
 */
export async function removeImageBackground(
  file: File,
  options: RemovalOptions
): Promise<Blob> {
  // Dynamic import to ensure this only runs client-side
  const { removeBackground } = await import('@imgly/background-removal');

  const blob = await removeBackground(file, {
    debug: false,
    // 'small' = faster/lighter, 'medium' = higher quality
    model: options.quality === 'ultra' ? 'medium' : 'small',
    output: {
      format: 'image/png',
      type: 'foreground',
    },
    progress: (key: string, current: number, total: number) => {
      if (total > 0 && options.onProgress) {
        options.onProgress(Math.round((current / total) * 100));
      }
    },
  });

  return blob;
}

// ---------------------------------------------------------------------------
// Batch processing
// ---------------------------------------------------------------------------

export interface BatchItem {
  id: string;
  file: File;
}

export interface BatchCallbacks {
  onItemStart: (id: string) => void;
  onItemProgress: (id: string, progress: number) => void;
  onItemDone: (id: string, blob: Blob) => void;
  onItemError: (id: string, error: string) => void;
  onOverallProgress: (percent: number) => void;
}

/**
 * Process images in controlled parallel batches.
 * Uses a semaphore pattern so at most `maxConcurrent` images run at once.
 */
export async function processBatch(
  items: BatchItem[],
  maxConcurrent: number,
  quality: 'high' | 'ultra',
  callbacks: BatchCallbacks,
  abortSignal?: AbortSignal
): Promise<void> {
  const total = items.length;
  if (total === 0) return;

  let completed = 0;
  const queue = [...items];

  async function processNext(): Promise<void> {
    while (queue.length > 0) {
      if (abortSignal?.aborted) return;

      const item = queue.shift();
      if (!item) return;

      callbacks.onItemStart(item.id);

      try {
        const blob = await removeImageBackground(item.file, {
          quality,
          onProgress: (pct) => callbacks.onItemProgress(item.id, pct),
        });

        if (abortSignal?.aborted) return;
        callbacks.onItemDone(item.id, blob);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        callbacks.onItemError(item.id, msg);
      } finally {
        completed++;
        callbacks.onOverallProgress(Math.round((completed / total) * 100));
      }
    }
  }

  // Spin up workers — capped at min(maxConcurrent, total)
  const workers = Math.min(maxConcurrent, total);
  await Promise.all(Array.from({ length: workers }, () => processNext()));
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export function blobToObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function getOutputFilename(originalName: string): string {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  return `${nameWithoutExt}_nobg.png`;
}
