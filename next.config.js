/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['googleapis', 'canvas', 'fluent-ffmpeg', 'pg', 'ffmpeg-static']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Include ffmpeg-static binary in the server bundle
      config.externals = config.externals || [];
      config.externals.push({
        'ffmpeg-static': 'ffmpeg-static'
      });
    }
    return config;
  }
}

module.exports = nextConfig;
