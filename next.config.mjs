/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['localhost:3000', '10.224.1.72:3000'],
    },
  },
  allowedDevOrigins: ['http://localhost:3000', 'http://10.224.1.72:3000'],
};

export default nextConfig;
