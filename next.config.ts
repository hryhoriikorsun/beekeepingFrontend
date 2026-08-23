import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Ships a self-contained server plus only the node_modules the app actually
  // touches, so the runtime image carries no build tooling at all.
  output: 'standalone',
};

export default nextConfig;
