/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false
  }
};

export default nextConfig;
