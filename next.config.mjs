const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  typescript: {
    // Danger: allows builds to succeed despite TypeScript errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Danger: allows builds to succeed despite ESLint errors
    ignoreDuringBuilds: true,
  },
  // Vercel Cron configuration
  async headers() {
    return [
      {
        source: '/api/cron/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ]
  },
}

export default nextConfig