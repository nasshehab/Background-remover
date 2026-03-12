'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, X, Zap, Sparkles, Info } from 'lucide-react';
import { useImageStore } from '@/store/useImageStore';

const PRESET_COLORS = [
  '#1a1a2e', // dark navy
  '#0f0f23', // deep dark
  '#ffffff', // white
  '#f8f8f8', // off-white
  '#1e3a5f', // dark blue
  '#2d1b4e', // dark purple
  '#1a2e1a', // dark green
  '#2e1a1a', // dark red
  'transparent',
];

export function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSettings } = useImageStore();

  return (
    <>
      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="
          flex items-center gap-2 px-4 py-2 rounded-xl
          glass border border-white/10
          text-sm text-white/60 hover:text-white/90
          hover:border-violet-500/30 hover:bg-violet-500/10
          transition-all duration-200
        "
      >
        <Settings2 className="w-4 h-4" />
        <span className="hidden sm:inline">Settings</span>
      </motion.button>

      {/* Sidebar panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="
                fixed top-0 right-0 h-full w-80 z-50
                glass-strong border-l border-white/10
                flex flex-col overflow-y-auto
              "
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-violet-400" />
                  <h2 className="font-display font-semibold text-white">Settings</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 space-y-8">

                {/* Quality */}
                <section>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
                    Processing Quality
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'high' as const, label: 'High', icon: Zap, desc: 'Faster, great quality' },
                      { value: 'ultra' as const, label: 'Ultra', icon: Sparkles, desc: 'Slower, best quality' },
                    ].map(({ value, label, icon: Icon, desc }) => (
                      <motion.button
                        key={value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateSettings({ quality: value })}
                        className={`
                          relative p-4 rounded-xl text-left
                          border transition-all duration-200
                          ${settings.quality === value
                            ? 'bg-violet-500/20 border-violet-500/50 text-white'
                            : 'bg-white/3 border-white/10 text-white/50 hover:text-white/80 hover:border-white/20'
                          }
                        `}
                      >
                        {settings.quality === value && (
                          <motion.div
                            layoutId="quality-indicator"
                            className="absolute inset-0 rounded-xl bg-violet-500/10"
                          />
                        )}
                        <Icon className={`w-5 h-5 mb-2 ${settings.quality === value ? 'text-violet-400' : ''}`} />
                        <div className="text-sm font-semibold">{label}</div>
                        <div className="text-xs text-white/40 mt-0.5">{desc}</div>
                      </motion.button>
                    ))}
                  </div>
                </section>

                {/* Concurrency */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                      Parallel Processing
                    </h3>
                    <span className="text-sm font-mono text-violet-400">
                      {settings.maxConcurrent} at once
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    value={settings.maxConcurrent}
                    onChange={(e) => updateSettings({ maxConcurrent: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-400
                      [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                    style={{
                      background: `linear-gradient(to right, #a78bfa ${((settings.maxConcurrent - 1) / 7) * 100}%, rgba(255,255,255,0.1) ${((settings.maxConcurrent - 1) / 7) * 100}%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-white/25 mt-2">
                    <span>1 (safe)</span>
                    <span>8 (fast)</span>
                  </div>
                  <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Info className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-400/80">
                      Higher values process faster but use more RAM. Lower if browser slows down.
                    </p>
                  </div>
                </section>

                {/* Preview background color */}
                <section>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
                    Preview Background
                  </h3>
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {PRESET_COLORS.map((color) => (
                      <motion.button
                        key={color}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => updateSettings({ bgPreviewColor: color })}
                        className={`
                          w-full aspect-square rounded-lg border-2 transition-all
                          ${settings.bgPreviewColor === color
                            ? 'border-violet-400 scale-110'
                            : 'border-white/10 hover:border-white/30'
                          }
                        `}
                        style={{
                          backgroundColor: color === 'transparent' ? undefined : color,
                          backgroundImage:
                            color === 'transparent'
                              ? 'repeating-conic-gradient(#333 0% 25%, #555 0% 50%)'
                              : undefined,
                          backgroundSize: color === 'transparent' ? '8px 8px' : undefined,
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-white/40">Custom:</label>
                    <input
                      type="color"
                      value={settings.bgPreviewColor === 'transparent' ? '#000000' : settings.bgPreviewColor}
                      onChange={(e) => updateSettings({ bgPreviewColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent"
                    />
                    <span className="text-xs font-mono text-white/30">{settings.bgPreviewColor}</span>
                  </div>
                </section>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10">
                <p className="text-xs text-white/25 text-center">
                  All processing happens locally in your browser.
                  <br />No images are uploaded anywhere.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
