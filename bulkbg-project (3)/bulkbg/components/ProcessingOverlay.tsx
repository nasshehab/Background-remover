'use client';

import { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import { useImageStore } from '@/store/useImageStore';
import { DownloadZip } from './DownloadZip';
import confetti from 'canvas-confetti';

function fireConfetti() {
  const count = 200;
  const defaults = { origin: { y: 0.7 } };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
      colors: ['#a78bfa', '#818cf8', '#60a5fa', '#f472b6', '#34d399', '#ffffff'],
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

export function ProcessingOverlay() {
  const { showSuccessModal, setShowSuccessModal, getDoneImages, images } = useImageStore();
  const hasFired = useRef(false);

  const doneImages = getDoneImages();
  const totalImages = images.length;
  const doneCount = doneImages.length;
  const errorCount = images.filter((i) => i.status === 'error').length;

  useEffect(() => {
    if (showSuccessModal && !hasFired.current) {
      hasFired.current = true;
      setTimeout(() => fireConfetti(), 200);
    }
    if (!showSuccessModal) {
      hasFired.current = false;
    }
  }, [showSuccessModal]);

  const handleClose = useCallback(() => {
    setShowSuccessModal(false);
  }, [setShowSuccessModal]);

  return (
    <AnimatePresence>
      {showSuccessModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="
              relative z-10 w-full max-w-md
              glass-strong rounded-3xl p-8
              border border-white/10
              shadow-2xl shadow-black/50
            "
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="
                absolute top-4 right-4 w-8 h-8 rounded-lg
                flex items-center justify-center
                bg-white/5 hover:bg-white/10
                text-white/40 hover:text-white
                transition-colors
              "
            >
              <X className="w-4 h-4" />
            </button>

            {/* Success icon */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className="
                  w-20 h-20 rounded-2xl
                  bg-gradient-to-br from-emerald-500/30 to-violet-500/30
                  border border-emerald-500/30
                  flex items-center justify-center
                  processing-orb
                "
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </motion.div>
            </div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-6"
            >
              <h2 className="text-2xl font-display font-bold gradient-text mb-2">
                All Done! ✨
              </h2>
              <p className="text-white/50 text-sm">
                Background removal complete
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-3 gap-3 mb-6"
            >
              {[
                { label: 'Processed', value: doneCount, color: 'text-emerald-400' },
                { label: 'Failed', value: errorCount, color: errorCount > 0 ? 'text-red-400' : 'text-white/30' },
                { label: 'Total', value: totalImages, color: 'text-violet-400' },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="glass rounded-xl p-3 text-center border border-white/5"
                >
                  <div className={`text-2xl font-display font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-white/40 mt-0.5">{label}</div>
                </div>
              ))}
            </motion.div>

            {/* Download */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center"
            >
              <DownloadZip />
            </motion.div>

            {/* Note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-xs text-white/25 mt-4"
            >
              Your images were processed locally – nothing was uploaded
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
