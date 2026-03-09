/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: { enabled: false },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
