import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'BulkBG – Bulk Background Remover',
  description:
    'Remove backgrounds from 100+ images at once. Free, private, AI-powered – runs entirely in your browser.',
  keywords: ['background remover', 'bulk', 'AI', 'transparent', 'PNG', 'free'],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'BulkBG – Bulk Background Remover',
    description: 'Remove backgrounds from 100+ images at once. Free & private.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#080810',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen antialiased">
        {/* Ambient background */}
        <div className="ambient-bg" aria-hidden="true" />
        
        {children}

        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(15, 15, 30, 0.95)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: 'white',
              backdropFilter: 'blur(20px)',
            },
          }}
        />
      </body>
    </html>
  );
}
