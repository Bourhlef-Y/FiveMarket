/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
    // Fallback pour la compatibilité (garde les domaines existants)
    domains: [
      'localhost', 
      'your-supabase-project.supabase.co', 
      'xqxmxkbxvxvxbxwxc.supabase.co',
      'ulyasxtikcjoxfevrbsg.supabase.co',
      'picsum.photos'
    ],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig 