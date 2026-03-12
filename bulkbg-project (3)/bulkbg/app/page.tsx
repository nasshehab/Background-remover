'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Wand2,
  Trash2,
  Loader2,
  ChevronDown,
  Zap,
  Shield,
  Globe,
  Layers,
} from 'lucide-react';
import { useImageStore } from '@/store/useImageStore';
import { UploadZone } from '@/components/UploadZone';
import { ImageCard } from '@/components/ImageCard';
import { DownloadZip } from '@/components/DownloadZip';
import { SettingsPanel } from '@/components/SettingsPanel';
import { ProcessingOverlay } from '@/components/ProcessingOverlay';
import { processBatch, blobToObjectUrl } from '@/lib/background-removal';
import { toast } from 'sonner';

const FEATURES = [
  {
    icon: Zap,
    title: 'AI-Powered',
    desc: 'State-of-the-art ONNX model runs directly in your browser',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Shield,
    title: '100% Private',
    desc: 'Your images never leave your device. Zero uploads, zero servers',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Globe,
    title: 'Works Offline',
    desc: 'After first load, works without internet connection',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Layers,
    title: 'Bulk Processing',
    desc: 'Handle up to 200 images at once with smart batching',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
];

export default function HomePage() {
  const {
    images,
    settings,
    isProcessingAll,
    overallProgress,
    clearAll,
    setIsProcessingAll,
    setOverallProgress,
    setImageStatus,
    setImageProgress,
    setImageResult,
    setImageError,
    setShowSuccessModal,
    getDoneImages,
    getProcessableImages,
  } = useImageStore();

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroY = useTransform(scrollY, [0, 300], [0, -50]);

  const handleProcessAll = useCallback(async () => {
    const processable = getProcessableImages();
    if (processable.length === 0) {
      toast.info('No images to process');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsProcessingAll(true);
    setOverallProgress(0);

    try {
      await processBatch(
        processable.map((img) => ({ id: img.id, file: img.file })),
        settings.maxConcurrent,
        settings.quality,
        {
          onItemStart: (id) => {
            setImageStatus(id, 'processing');
            setImageProgress(id, 0);
          },
          onItemProgress: (id, pct) => setImageProgress(id, pct),
          onItemDone: (id, blob) => {
            const url = blobToObjectUrl(blob);
            setImageResult(id, blob, url);
          },
          onItemError: (id, error) => setImageError(id, error),
          onOverallProgress: (pct) => setOverallProgress(pct),
        },
        controller.signal
      );

      if (!controller.signal.aborted) {
        setShowSuccessModal(true);
      }
    } catch {
      if (!controller.signal.aborted) {
        toast.error('Processing failed. Please try again.');
      }
    } finally {
      setIsProcessingAll(false);
      abortRef.current = null;
    }
  }, [
    getProcessableImages,
    settings.maxConcurrent,
    settings.quality,
    setIsProcessingAll,
    setOverallProgress,
    setImageStatus,
    setImageProgress,
    setImageResult,
    setImageError,
    setShowSuccessModal,
  ]);

  const handleAbort = useCallback(() => {
    abortRef.current?.abort();
    setIsProcessingAll(false);
    setOverallProgress(0);
    toast.info('Processing cancelled');
  }, [setIsProcessingAll, setOverallProgress]);

  const handleClearAll = useCallback(() => {
    if (isProcessingAll) handleAbort();
    clearAll();
    setShowClearConfirm(false);
    toast.success('All images cleared');
  }, [clearAll, handleAbort, isProcessingAll]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isProcessingAll && getProcessableImages().length > 0) {
          handleProcessAll();
        }
      }
      if (e.key === 'Escape' && isProcessingAll) {
        handleAbort();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isProcessingAll, handleProcessAll, handleAbort, getProcessableImages]);

  const processableCount = getProcessableImages().length;
  const doneCount = getDoneImages().length;
  const hasImages = images.length > 0;

  return (
    <div className="relative min-h-screen">
      {/* Hero */}
      <motion.section
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative z-10 flex flex-col items-center text-center px-4 pt-16 pb-8"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 font-medium"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          100% Browser-Based · Zero Server Costs · Private by Default
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-display font-bold mb-4 leading-none tracking-tight"
        >
          <span className="text-white">Bulk</span>
          <span className="gradient-text">BG</span>
          <br />
          <span className="text-white/80 text-3xl sm:text-4xl md:text-5xl font-normal">
            Remove backgrounds at scale
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-white/40 text-lg max-w-xl mb-8"
        >
          Drop 200 images. One click. Perfect transparent PNGs. Runs entirely in your browser —
          no uploads, no subscriptions, no limits.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10 w-full max-w-2xl"
        >
          {FEATURES.map(({ icon: Icon, title, desc, color, bg }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className={`${bg} rounded-xl p-4 border border-white/5 text-left transition-transform hover:-translate-y-1 duration-200`}
            >
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <div className="text-sm font-semibold text-white/90 mb-0.5">{title}</div>
              <div className="text-xs text-white/40 leading-relaxed">{desc}</div>
            </motion.div>
          ))}
        </motion.div>

        {!hasImages && (
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-white/20"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        )}
      </motion.section>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 pb-20">
        <div className="mb-8">
          <UploadZone />
        </div>

        {/* Toolbar */}
        <AnimatePresence>
          {hasImages && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-wrap items-center justify-between gap-3 mb-6 p-4 rounded-2xl glass border border-white/8"
            >
              <div className="flex items-center gap-3">
                <SettingsPanel />
                <div className="text-sm text-white/40">
                  <span className="text-white font-mono">{images.length}</span> images
                  {doneCount > 0 && (
                    <>{' · '}<span className="text-emerald-400 font-mono">{doneCount}</span> done</>
                  )}
                  {processableCount > 0 && (
                    <>{' · '}<span className="text-white/30 font-mono">{processableCount}</span> pending</>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <DownloadZip />

                {isProcessingAll ? (
                  <div className="flex items-center gap-3">
                    <div className="relative min-w-[180px] rounded-xl overflow-hidden bg-violet-900/40">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-600 to-blue-600"
                        initial={{ width: '0%' }}
                        animate={{ width: `${overallProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                      <div className="relative flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{overallProgress}%</span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAbort}
                      className="px-4 py-2.5 rounded-xl text-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      Cancel
                    </motion.button>
                  </div>
                ) : (
                  processableCount > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleProcessAll}
                      className="relative overflow-hidden flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-lg shadow-violet-500/20 transition-all duration-200"
                    >
                      <span
                        className="absolute inset-0 -translate-x-full"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                          animation: 'shimmer 2s linear infinite',
                        }}
                      />
                      <Wand2 className="w-4 h-4" />
                      Process All ({processableCount})
                      <kbd className="hidden sm:inline text-[10px] opacity-60 px-1.5 py-0.5 rounded bg-black/20 font-mono ml-1">
                        ⌘↵
                      </kbd>
                    </motion.button>
                  )
                )}

                {!isProcessingAll && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-red-400 glass border border-white/8 hover:border-red-500/30 hover:bg-red-500/10 transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Clear All</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image Grid */}
        <AnimatePresence mode="popLayout">
          {hasImages ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="masonry-grid"
            >
              <AnimatePresence>
                {images.map((item, index) => (
                  <ImageCard key={item.id} item={item} index={index} />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 2, -2, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="text-7xl mb-6"
              >
                🖼️
              </motion.div>
              <h3 className="text-xl font-display font-semibold text-white/50 mb-2">
                No images yet
              </h3>
              <p className="text-white/25 text-sm max-w-sm">
                Drop some images above or click to browse. Supports JPG, PNG, WEBP, and HEIC.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Clear Confirm Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowClearConfirm(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <motion.div
              initial={{ scale: 0.85, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 glass-strong rounded-2xl p-6 max-w-sm w-full border border-white/10"
            >
              <h3 className="text-lg font-display font-semibold text-white mb-2">
                Clear all images?
              </h3>
              <p className="text-white/40 text-sm mb-6">
                This will remove all {images.length} images and their processed results. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl glass border border-white/10 text-sm text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold text-white transition-colors"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProcessingOverlay />

      <footer className="relative z-10 border-t border-white/5 py-8 text-center">
        <p className="text-xs text-white/20">
          BulkBG · Built with{' '}
          <span className="text-violet-400">@imgly/background-removal</span>
          {' '}· All processing is local · No data collected
        </p>
      </footer>
    </div>
  );
}
