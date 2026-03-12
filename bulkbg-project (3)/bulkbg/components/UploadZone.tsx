'use client';

import { useCallback, useRef, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ImagePlus, Sparkles, AlertCircle } from 'lucide-react';
import { useImageStore } from '@/store/useImageStore';
import { toast } from 'sonner';

const MAX_IMAGES = 200;
const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
};

// Particle configuration for drop zone hover effect
const PARTICLE_COUNT = 30;

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 2,
    duration: Math.random() * 3 + 2,
  }));
}

const particles = generateParticles();

export function UploadZone() {
  const { addImages, images } = useImageStore();
  const [isDragActive, setIsDragActive] = useState(false);
  const [rejectedCount, setRejectedCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Handle rejections
      if (rejectedFiles.length > 0) {
        const oversized = rejectedFiles.filter((r) =>
          r.errors.some((e) => e.code === 'file-too-large')
        );
        const wrongType = rejectedFiles.filter((r) =>
          r.errors.some((e) => e.code === 'file-invalid-type')
        );

        if (oversized.length > 0) {
          toast.error(`${oversized.length} file(s) exceeded ${MAX_FILE_SIZE_MB}MB limit`);
        }
        if (wrongType.length > 0) {
          toast.error(`${wrongType.length} file(s) have unsupported format`);
        }
        setRejectedCount(rejectedFiles.length);
      }

      if (acceptedFiles.length === 0) return;

      const remaining = MAX_IMAGES - images.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${MAX_IMAGES} images reached. Remove some to add more.`);
        return;
      }

      if (acceptedFiles.length > remaining) {
        toast.warning(
          `Only ${remaining} slot(s) left. Added first ${remaining} of ${acceptedFiles.length} files.`
        );
      }

      addImages(acceptedFiles);

      const addedCount = Math.min(acceptedFiles.length, remaining);
      if (addedCount > 0) {
        toast.success(`Added ${addedCount} image${addedCount !== 1 ? 's' : ''}`);
      }
    },
    [addImages, images.length]
  );

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  });

  const isFull = images.length >= MAX_IMAGES;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="w-full"
    >
      <div
        {...getRootProps()}
        className={`
          relative overflow-hidden rounded-2xl cursor-pointer
          transition-all duration-300 select-none
          ${isDragActive ? 'scale-[1.02]' : 'scale-100'}
          ${isFull ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />

        {/* Animated border */}
        <div
          className={`
            absolute inset-0 rounded-2xl transition-opacity duration-300
            ${isDragActive ? 'opacity-100' : 'opacity-0'}
          `}
          style={{
            background:
              'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(96,165,250,0.4), rgba(139,92,246,0.4))',
            backgroundSize: '200% 200%',
            animation: isDragActive ? 'shimmer 2s linear infinite' : 'none',
          }}
        />

        {/* Main zone */}
        <div
          className={`
            relative z-10 flex flex-col items-center justify-center
            min-h-[280px] sm:min-h-[340px] rounded-2xl
            border-2 border-dashed transition-all duration-300
            ${isDragActive
              ? 'border-violet-400 bg-violet-500/10'
              : isDragReject
              ? 'border-red-400 bg-red-500/5'
              : 'border-white/10 bg-white/[0.02] hover:border-violet-500/40 hover:bg-violet-500/5'
            }
          `}
        >
          {/* Particles on drag */}
          <AnimatePresence>
            {isDragActive &&
              particles.map((p) => (
                <motion.div
                  key={p.id}
                  className="absolute rounded-full bg-violet-400 pointer-events-none"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 0.8, 0],
                    scale: [0, 1, 0],
                    y: [`${p.y}%`, `${p.y - 20}%`],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: p.duration,
                    delay: p.delay,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    width: p.size,
                    height: p.size,
                  }}
                />
              ))}
          </AnimatePresence>

          {/* Icon */}
          <motion.div
            animate={isDragActive ? { scale: 1.2, rotate: [0, -10, 10, 0] } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="relative mb-6"
          >
            <div
              className={`
                w-20 h-20 rounded-2xl flex items-center justify-center
                transition-colors duration-300
                ${isDragActive ? 'bg-violet-500/30' : 'bg-white/5'}
              `}
            >
              {isDragReject ? (
                <AlertCircle className="w-10 h-10 text-red-400" />
              ) : isDragActive ? (
                <Sparkles className="w-10 h-10 text-violet-400" />
              ) : (
                <Upload className="w-10 h-10 text-white/40" />
              )}
            </div>

            {/* Orbiting dot */}
            {isDragActive && (
              <motion.div
                className="absolute w-3 h-3 rounded-full bg-violet-400"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                style={{
                  top: '-4px',
                  left: '50%',
                  transformOrigin: '0 42px',
                }}
              />
            )}
          </motion.div>

          {/* Text */}
          <div className="text-center px-6">
            <motion.p
              className="text-xl sm:text-2xl font-display font-semibold text-white/90 mb-2"
              animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
            >
              {isDragActive
                ? 'Drop to start magic ✨'
                : isDragReject
                ? 'Unsupported file type'
                : 'Drop images here'}
            </motion.p>
            <p className="text-sm text-white/40 mb-4">
              {isFull
                ? `Maximum ${MAX_IMAGES} images reached`
                : `or click to browse • JPG, PNG, WEBP, HEIC • max ${MAX_FILE_SIZE_MB}MB each`}
            </p>

            {/* Browse button */}
            {!isDragActive && !isFull && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="
                  inline-flex items-center gap-2 px-5 py-2.5
                  rounded-full text-sm font-medium
                  bg-white/8 border border-white/12
                  text-white/70 hover:text-white
                  hover:bg-violet-500/20 hover:border-violet-400/40
                  transition-all duration-200
                "
              >
                <ImagePlus className="w-4 h-4" />
                Browse files
              </motion.div>
            )}
          </div>

          {/* Slots indicator */}
          {images.length > 0 && !isFull && (
            <div className="absolute bottom-4 right-4 text-xs text-white/30 font-mono">
              {images.length} / {MAX_IMAGES}
            </div>
          )}
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      <p className="text-center text-xs text-white/25 mt-3 font-mono">
        Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">⌘ K</kbd> to open file picker
      </p>
    </motion.div>
  );
}
