/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false
  },
  async redirects() {
    return [
      {
        source: '/tv-series',
        destination: '/series',
        permanent: true,
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/stream/:path*',
        destination: 'http://127.0.0.1:8080/api/v1/stream/:path*',
      },
      {
        source: '/api/v1/torrent/:path*',
        destination: 'http://127.0.0.1:8080/api/v1/torrent/:path*',
      }
    ];
  },
  // [RECTIFICATION:SECURITY_CHECKS_ENHANCEMENT]
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ];
  }
};

export default nextConfig;
