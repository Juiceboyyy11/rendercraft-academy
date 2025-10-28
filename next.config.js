/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['images.unsplash.com', 'localhost', 'itcitfscjmvtgtleainu.supabase.co'],
  },
}

module.exports = nextConfig

