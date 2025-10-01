/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['googleapis', 'canvas', 'fluent-ffmpeg', 'pg']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure ffmpeg-static is bundled with its binary
      config.externals = config.externals || [];
      // Don't externalize ffmpeg-static so it gets bundled with the binary
      if (Array.isArray(config.externals)) {
        config.externals = config.externals.filter(external => 
          typeof external === 'string' ? external !== 'ffmpeg-static' : true
        );
      }
    }
    return config;
  }
}

module.exports = nextConfig;
