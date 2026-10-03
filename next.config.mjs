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
        source: '/my-list',
        destination: '/list',
      }
    ];
  }
};

export default nextConfig;
