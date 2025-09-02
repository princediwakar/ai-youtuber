/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Updated to use @ffmpeg-installer/ffmpeg instead of ffmpeg-static
    serverComponentsExternalPackages: ['googleapis', 'canvas', 'fluent-ffmpeg', 'pg', '@ffmpeg-installer/ffmpeg']
  },
  
  // This is the added webpack configuration to fix the FFmpeg path issue.
  webpack: (config, { isServer }) => {
    // This tells Next.js to not bundle this dependency on the server.
    // Instead, it will be resolved from node_modules at runtime.
    if (isServer) {
      config.externals.push('@ffmpeg-installer/ffmpeg');
    }
    return config;
  },
}

module.exports = nextConfig;
