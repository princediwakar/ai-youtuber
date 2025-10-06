/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'googleapis', 
      'canvas', 
      'fluent-ffmpeg', 
      'pg', 
      '@ffmpeg-installer/ffmpeg'
    ]
  }
}

module.exports = nextConfig;
