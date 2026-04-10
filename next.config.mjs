/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/ESC-Internal',
  assetPrefix: '/ESC-Internal',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
