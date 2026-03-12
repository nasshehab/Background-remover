# BulkBG – Bulk Background Remover

> Remove backgrounds from 200 images at once. Free, private, AI-powered – runs entirely in your browser.

![BulkBG Screenshot](public/screenshot.png)

## ✨ Features

- **Bulk processing** – Upload up to 200 images and process them all with one click
- **AI-powered** – Uses `@imgly/background-removal` with ONNX Runtime in WebAssembly
- **100% Private** – All processing happens in your browser. Nothing is uploaded to any server
- **Works Offline** – After first model download, works without internet
- **Smart batching** – Processes in configurable parallel batches to prevent tab crashes
- **Before/After flip** – 3D flip card to compare original vs processed
- **ZIP download** – All processed images packaged into a ZIP instantly
- **Individual downloads** – Download each image separately
- **Settings** – Quality toggle, parallel processing slider, preview background color
- **Keyboard shortcuts** – `⌘K` to open file picker, `⌘↵` to process all, `Esc` to cancel

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note**: On first run, the AI model (~100MB) will be downloaded and cached in your browser. This only happens once.

## 🏗️ Build for Production

```bash
npm run build
npm start
```

## ☁️ Deploy to Vercel

```bash
npx vercel deploy
```

Or connect your GitHub repo to Vercel for automatic deployments.

**Important**: The `next.config.mjs` already includes the required COOP/COEP headers for SharedArrayBuffer (required by ONNX Runtime). Vercel respects these headers automatically.

## 🛠️ Tech Stack

| Package | Purpose |
|---------|---------|
| Next.js 15 (App Router) | Framework |
| React 19 | UI |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Framer Motion 12 | Animations |
| Zustand | State management |
| @imgly/background-removal | AI background removal |
| JSZip + file-saver | ZIP generation |
| react-dropzone | Drag & drop upload |
| canvas-confetti | Success celebration |
| sonner | Toast notifications |
| lucide-react | Icons |

## 📁 Project Structure

```
bulkbg/
├── app/
│   ├── globals.css        # Cinematic dark theme
│   ├── layout.tsx         # Root layout + fonts
│   └── page.tsx           # Main page
├── components/
│   ├── UploadZone.tsx     # Drag & drop with particles
│   ├── ImageCard.tsx      # Flip card + progress ring
│   ├── DownloadZip.tsx    # ZIP generation + download
│   ├── SettingsPanel.tsx  # Sidebar settings
│   └── ProcessingOverlay.tsx  # Success modal + confetti
├── lib/
│   └── background-removal.ts  # AI wrapper + batching
├── store/
│   └── useImageStore.ts   # Zustand global state
└── public/
    └── manifest.json      # PWA manifest
```

## ⚙️ Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Quality | High | `high` = small model (faster), `ultra` = medium model (better quality) |
| Parallel Processing | 4 | Max concurrent images processed simultaneously |
| Preview Background | Dark navy | Color shown behind transparent result in flip card |

## 🔒 Privacy

BulkBG processes all images locally using WebAssembly. The AI model is downloaded once and cached by the browser. After that, the app works fully offline. No image data is ever transmitted to any server.

## 📝 License

MIT
