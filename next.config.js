/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // I've added 'ffmpeg-static' to this list as well for consistency.
    serverComponentsExternalPackages: ['googleapis', 'canvas', 'fluent-ffmpeg', 'pg', 'ffmpeg-static']
  },
  
  // This is the added webpack configuration to fix the FFmpeg path issue.
  webpack: (config, { isServer }) => {
    // This tells Next.js to not bundle this dependency on the server.
    // Instead, it will be resolved from node_modules at runtime.
    if (isServer) {
      config.externals.push('ffmpeg-static');
    }
    return config;
  },
}

module.exports = nextConfig;
