/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Updated to use ffmpeg-static for reliable serverless support - remove ffmpeg-static from externals
    serverComponentsExternalPackages: ['googleapis', 'canvas', 'fluent-ffmpeg', 'pg']
  },
  
  // Configure webpack to properly handle ffmpeg-static for serverless
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't externalize ffmpeg-static - we want it bundled
      // Remove any existing external for ffmpeg-static
      config.externals = config.externals.filter(external => {
        if (typeof external === 'string') {
          return external !== 'ffmpeg-static';
        }
        return true;
      });
    }
    return config;
  },
}

module.exports = nextConfig;
