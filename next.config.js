/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@deck.gl/core', '@deck.gl/layers', '@mapbox/tiny-sdf']
  },
  env: {
    AGENTS_ENABLED: 'true',
    ORCHESTRATOR_VERSION: '1.0.0'
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  }
};

module.exports = nextConfig;
