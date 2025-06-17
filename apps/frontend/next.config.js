/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@multiverse/ui', '@multiverse/sdk', '@multiverse/wagmi-db']
}

module.exports = nextConfig 