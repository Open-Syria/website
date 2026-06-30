import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        hostname: "avatars.githubusercontent.com",
        protocol: "https",
      },
    ],
  },
  experimental: {
    rootParams: true,
  },
}

export default withNextIntl(nextConfig)
