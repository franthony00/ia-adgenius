/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['10.0.0.113', '192.168.2.102'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.fbcdn.net' },      // Meta CDN (ad images)
      { protocol: 'https', hostname: 'scontent.cdninstagram.com' },
    ],
  },
};

module.exports = nextConfig;
