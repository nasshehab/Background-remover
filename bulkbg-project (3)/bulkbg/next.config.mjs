/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't fail the build on ESLint warnings or TS errors in CI
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  // Required for @imgly/background-removal WASM files
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Safely exclude heavy WASM lib from server bundle
    // Next.js 15 externals can be a function or array — handle both
    if (isServer) {
      const existing = config.externals;
      if (typeof existing === 'function') {
        config.externals = async (ctx) => {
          if (ctx.request === '@imgly/background-removal') return ctx.request;
          return existing(ctx);
        };
      } else {
        config.externals = [
          ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
          '@imgly/background-removal',
        ];
      }
    }

    return config;
  },
  // COOP/COEP headers required for SharedArrayBuffer (ONNX Runtime)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
