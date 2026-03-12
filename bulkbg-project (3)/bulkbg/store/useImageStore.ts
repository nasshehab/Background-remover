/**
 * Global state management for BulkBG using Zustand
 */
import { create } from 'zustand';

export type ImageStatus = 'idle' | 'processing' | 'done' | 'error';

export type ProcessingQuality = 'high' | 'ultra';

export interface ImageItem {
  id: string;
  file: File;
  /** Object URL for the original image preview */
  previewUrl: string;
  /** Object URL for the processed (no-bg) image */
  resultUrl: string | null;
  /** Blob for the processed image (used for ZIP) */
  resultBlob: Blob | null;
  status: ImageStatus;
  progress: number; // 0-100
  error: string | null;
  /** Whether the flip card is showing the result side */
  isFlipped: boolean;
}

export interface AppSettings {
  quality: ProcessingQuality;
  bgPreviewColor: string;
  maxConcurrent: number;
}

interface ImageStore {
  images: ImageItem[];
  settings: AppSettings;
  isProcessingAll: boolean;
  overallProgress: number;
  showSuccessModal: boolean;

  // Image management
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  clearAll: () => void;
  setImageStatus: (id: string, status: ImageStatus) => void;
  setImageProgress: (id: string, progress: number) => void;
  setImageResult: (id: string, blob: Blob, url: string) => void;
  setImageError: (id: string, error: string) => void;
  toggleFlip: (id: string) => void;

  // Processing state
  setIsProcessingAll: (val: boolean) => void;
  setOverallProgress: (val: number) => void;
  setShowSuccessModal: (val: boolean) => void;

  // Settings
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Computed helpers
  getDoneImages: () => ImageItem[];
  getProcessableImages: () => ImageItem[];
}

const generateId = () => Math.random().toString(36).slice(2, 11);

const MAX_IMAGES = 200;
const MAX_FILE_SIZE_MB = 10;

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

export const useImageStore = create<ImageStore>((set, get) => ({
  images: [],
  settings: {
    quality: 'high',
    bgPreviewColor: '#1a1a2e',
    maxConcurrent: 4,
  },
  isProcessingAll: false,
  overallProgress: 0,
  showSuccessModal: false,

  addImages: (files: File[]) => {
    const current = get().images;

    // Filter valid files
    const validFiles = files.filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) return false;
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) return false;
      // Deduplicate by name+size
      return !current.some((img) => img.file.name === f.name && img.file.size === f.size);
    });

    const slotsAvailable = MAX_IMAGES - current.length;
    const toAdd = validFiles.slice(0, slotsAvailable);

    const newItems: ImageItem[] = toAdd.map((file) => ({
      id: generateId(),
      file,
      previewUrl: URL.createObjectURL(file),
      resultUrl: null,
      resultBlob: null,
      status: 'idle',
      progress: 0,
      error: null,
      isFlipped: false,
    }));

    set((state) => ({ images: [...state.images, ...newItems] }));
  },

  removeImage: (id: string) => {
    const img = get().images.find((i) => i.id === id);
    if (img) {
      URL.revokeObjectURL(img.previewUrl);
      if (img.resultUrl) URL.revokeObjectURL(img.resultUrl);
    }
    set((state) => ({ images: state.images.filter((i) => i.id !== id) }));
  },

  clearAll: () => {
    // Clean up object URLs to prevent memory leaks
    get().images.forEach((img) => {
      URL.revokeObjectURL(img.previewUrl);
      if (img.resultUrl) URL.revokeObjectURL(img.resultUrl);
    });
    set({ images: [], overallProgress: 0, showSuccessModal: false });
  },

  setImageStatus: (id, status) =>
    set((state) => ({
      images: state.images.map((img) => (img.id === id ? { ...img, status } : img)),
    })),

  setImageProgress: (id, progress) =>
    set((state) => ({
      images: state.images.map((img) => (img.id === id ? { ...img, progress } : img)),
    })),

  setImageResult: (id, blob, url) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id
          ? { ...img, resultBlob: blob, resultUrl: url, status: 'done', progress: 100 }
          : img
      ),
    })),

  setImageError: (id, error) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, error, status: 'error', progress: 0 } : img
      ),
    })),

  toggleFlip: (id) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, isFlipped: !img.isFlipped } : img
      ),
    })),

  setIsProcessingAll: (val) => set({ isProcessingAll: val }),
  setOverallProgress: (val) => set({ overallProgress: val }),
  setShowSuccessModal: (val) => set({ showSuccessModal: val }),

  updateSettings: (settings) =>
    set((state) => ({ settings: { ...state.settings, ...settings } })),

  getDoneImages: () => get().images.filter((i) => i.status === 'done'),
  getProcessableImages: () =>
    get().images.filter((i) => i.status === 'idle' || i.status === 'error'),
}));
