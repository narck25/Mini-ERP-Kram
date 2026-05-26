/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // ============================================================
  // Configuración de Server Actions para producción detrás de proxy
  // ============================================================
  experimental: {
    serverActions: {
      // Permitir orígenes de producción y desarrollo
      allowedOrigins: [
        'erp.kramhub.site',
        'apierp.kramhub.site',
        'localhost:3000',
        'localhost:3002',
        process.env.NEXT_PUBLIC_ALLOWED_ORIGIN,
      ].filter(Boolean),
    },
  },

  // ============================================================
  // Configuración de imágenes
  // ============================================================
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },

  // ============================================================
  // Configuración de compresión y rendimiento
  // ============================================================
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // ============================================================
  // Rewrites para API proxy
  // ============================================================
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${apiUrl}/uploads/:path*`,
      },
    ];
  },

  // ============================================================
  // Headers de seguridad para producción detrás de proxy
  // ============================================================
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
