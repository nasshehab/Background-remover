'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, RotateCcw, Loader2, CheckCircle2, AlertCircle, Wand2 } from 'lucide-react';
import { useImageStore, type ImageItem } from '@/store/useImageStore';
import { removeImageBackground, blobToObjectUrl, getOutputFilename } from '@/lib/background-removal';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

function ProgressRing({
  progress,
  size = 44,
  strokeWidth = 3,
  color = '#a78bfa',
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="progress-ring">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        animate={{ strokeDashoffset }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="progress-ring-circle"
      />
    </svg>
  );
}

interface ImageCardProps {
  item: ImageItem;
  index: number;
}

export function ImageCard({ item, index }: ImageCardProps) {
  const { removeImage, setImageStatus, setImageProgress, setImageResult, setImageError, toggleFlip, settings } =
    useImageStore();
  const [isProcessingSingle, setIsProcessingSingle] = useState(false);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      removeImage(item.id);
    },
    [removeImage, item.id]
  );

  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (item.resultBlob) {
        const filename = getOutputFilename(item.file.name);
        saveAs(item.resultBlob, filename);
        toast.success(`Saved ${filename}`);
      }
    },
    [item.resultBlob, item.file.name]
  );

  const handleProcessSingle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isProcessingSingle || item.status === 'processing') return;

      setIsProcessingSingle(true);
      setImageStatus(item.id, 'processing');
      setImageProgress(item.id, 0);

      try {
        const blob = await removeImageBackground(item.file, {
          quality: settings.quality,
          onProgress: (pct) => setImageProgress(item.id, pct),
        });

        const url = blobToObjectUrl(blob);
        setImageResult(item.id, blob, url);
        toast.success(`${item.file.name} processed!`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Processing failed';
        setImageError(item.id, msg);
        toast.error(`Failed: ${item.file.name}`);
      } finally {
        setIsProcessingSingle(false);
      }
    },
    [
      isProcessingSingle,
      item.id,
      item.file,
      item.status,
      settings.quality,
      setImageStatus,
      setImageProgress,
      setImageResult,
      setImageError,
    ]
  );

  const handleFlip = useCallback(
    (e: React.MouseEvent) => {
      if (item.status === 'done') {
        toggleFlip(item.id);
      }
    },
    [item.id, item.status, toggleFlip]
  );

  const isProcessing = item.status === 'processing' || isProcessingSingle;
  const isDone = item.status === 'done';
  const isError = item.status === 'error';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -10 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      className="masonry-item group relative"
    >
      {/* Card */}
      <div
        className={`
          flip-card relative rounded-xl overflow-hidden
          ${isDone ? 'cursor-pointer' : ''}
          ${item.isFlipped ? 'flipped' : ''}
        `}
        onClick={handleFlip}
        style={{ minHeight: '160px' }}
      >
        <div className="flip-card-inner">
          {/* FRONT: original */}
          <div className="flip-card-front relative bg-white/5">
            <img
              src={item.previewUrl}
              alt={item.file.name}
              className="w-full h-auto object-cover block"
              style={{ maxHeight: '300px' }}
              loading="lazy"
            />

            {/* Processing overlay */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2"
                >
                  <ProgressRing progress={item.progress} />
                  <span className="text-xs font-mono text-white/80">{item.progress}%</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Done badge */}
            <AnimatePresence>
              {isDone && !item.isFlipped && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error overlay */}
            {isError && (
              <div className="absolute inset-0 bg-red-900/40 flex flex-col items-center justify-center gap-1 p-2">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <p className="text-xs text-red-300 text-center leading-tight">{item.error}</p>
              </div>
            )}

            {/* Flip hint */}
            {isDone && !item.isFlipped && (
              <div className="absolute bottom-2 left-2 text-[10px] text-white/40 font-mono bg-black/40 px-1.5 py-0.5 rounded">
                tap to see result
              </div>
            )}
          </div>

          {/* BACK: result */}
          <div
            className="flip-card-back checkerboard"
            style={{ backgroundColor: settings.bgPreviewColor }}
          >
            {item.resultUrl && (
              <img
                src={item.resultUrl}
                alt={`${item.file.name} – no background`}
                className="w-full h-full object-contain block"
                style={{ maxHeight: '300px' }}
                loading="lazy"
              />
            )}
            {item.isFlipped && (
              <div className="absolute bottom-2 left-2 text-[10px] text-white/40 font-mono bg-black/40 px-1.5 py-0.5 rounded">
                tap to see original
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control bar */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 + 0.2 }}
        className="
          mt-1.5 flex items-center gap-1 px-1
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
        "
      >
        {/* File name */}
        <span className="flex-1 text-[11px] text-white/40 truncate font-mono" title={item.file.name}>
          {item.file.name}
        </span>

        {/* Process single */}
        {(item.status === 'idle' || item.status === 'error') && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleProcessSingle}
            className="
              w-7 h-7 rounded-lg flex items-center justify-center
              bg-violet-500/20 hover:bg-violet-500/40
              text-violet-400 hover:text-violet-300
              transition-colors duration-150
            "
            title="Remove background"
          >
            <Wand2 className="w-3.5 h-3.5" />
          </motion.button>
        )}

        {/* Processing spinner */}
        {isProcessing && (
          <div className="w-7 h-7 flex items-center justify-center">
            <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
          </div>
        )}

        {/* Download */}
        {isDone && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleDownload}
            className="
              w-7 h-7 rounded-lg flex items-center justify-center
              bg-emerald-500/20 hover:bg-emerald-500/40
              text-emerald-400 hover:text-emerald-300
              transition-colors duration-150
            "
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </motion.button>
        )}

        {/* Retry */}
        {isError && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleProcessSingle}
            className="
              w-7 h-7 rounded-lg flex items-center justify-center
              bg-amber-500/20 hover:bg-amber-500/40
              text-amber-400 hover:text-amber-300
              transition-colors duration-150
            "
            title="Retry"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </motion.button>
        )}

        {/* Remove */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleRemove}
          className="
            w-7 h-7 rounded-lg flex items-center justify-center
            bg-white/5 hover:bg-red-500/20
            text-white/30 hover:text-red-400
            transition-colors duration-150
          "
          title="Remove"
        >
          <X className="w-3.5 h-3.5" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
