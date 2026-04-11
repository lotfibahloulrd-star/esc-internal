/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/ESC-Internal',
  assetPrefix: '/ESC-Internal',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
