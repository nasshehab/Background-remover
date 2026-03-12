'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Archive, Loader2, CheckCircle2 } from 'lucide-react';
import { useImageStore } from '@/store/useImageStore';
import { getOutputFilename } from '@/lib/background-removal';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export function DownloadZip() {
  const { getDoneImages } = useImageStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const doneImages = getDoneImages();
  const count = doneImages.length;

  const handleDownload = useCallback(async () => {
    if (isGenerating || count === 0) return;

    setIsGenerating(true);
    const toastId = toast.loading(`Packing ${count} image${count !== 1 ? 's' : ''} into ZIP...`);

    try {
      const zip = new JSZip();
      const folder = zip.folder('bulkbg-export');

      for (const img of doneImages) {
        if (img.resultBlob) {
          const filename = getOutputFilename(img.file.name);
          folder?.file(filename, img.resultBlob);
        }
      }

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const timestamp = new Date().toISOString().slice(0, 10);
      saveAs(zipBlob, `bulkbg-export-${timestamp}.zip`);

      toast.success(`Downloaded ${count} processed images!`, { id: toastId });
      setIsDone(true);
      setTimeout(() => setIsDone(false), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ZIP generation failed';
      toast.error(msg, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  }, [doneImages, count, isGenerating]);

  if (count === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col sm:flex-row items-center gap-3"
    >
      {/* Stats */}
      <div className="text-sm text-white/50">
        <span className="text-emerald-400 font-semibold font-mono">{count}</span>
        {' '}image{count !== 1 ? 's' : ''} ready
      </div>

      {/* Download button */}
      <motion.button
        onClick={handleDownload}
        disabled={isGenerating}
        whileHover={!isGenerating ? { scale: 1.03 } : {}}
        whileTap={!isGenerating ? { scale: 0.97 } : {}}
        className={`
          relative overflow-hidden flex items-center gap-2.5
          px-6 py-3 rounded-xl text-sm font-semibold
          transition-all duration-300
          ${isDone
            ? 'bg-emerald-600 text-white'
            : 'bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500'
          }
          disabled:opacity-60 disabled:cursor-not-allowed
          shadow-lg shadow-violet-500/20
        `}
      >
        {/* Shimmer effect */}
        {!isGenerating && !isDone && (
          <span
            className="absolute inset-0 -translate-x-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
              animation: 'shimmer 2s linear infinite',
            }}
          />
        )}

        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Packing ZIP...
            </motion.span>
          ) : isDone ? (
            <motion.span
              key="done"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Downloaded!
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Archive className="w-4 h-4" />
              Download ZIP ({count})
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}
