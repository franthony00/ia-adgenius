/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['10.0.0.113', '192.168.2.101', '192.168.2.102'],
  images: {
    // All mock data now uses local /public/ads/*.svg — no external images needed.
    // These entries cover: user-entered URLs, ad platform CDNs, and common image hosts.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'www.magnific.com' },
      { protocol: 'https', hostname: '*.magnific.com' },
      { protocol: 'https', hostname: '*.fbcdn.net' },
      { protocol: 'https', hostname: 'scontent.cdninstagram.com' },
    ],
  },
};

module.exports = nextConfig;
