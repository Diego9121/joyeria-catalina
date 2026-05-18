/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'zszvnsqozyaaxbpqpnrp.supabase.co' },
      { protocol: 'https', hostname: 'zszvnsqozyaaxbpqpnrp.supabase.storage.supabase.co' },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;