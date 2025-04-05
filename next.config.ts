/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
    remotePatterns: [],
    dangerouslyAllowSVG: true,
    unoptimized: true, // This will allow base64 images to work
  },
};

module.exports = nextConfig;
