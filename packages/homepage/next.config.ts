import type { NextConfig } from 'next'
import { resolve } from 'node:path'
import createMDX from '@next/mdx'

/** GitHub Pages 项目站：https://<user>.github.io/ofc-gm/ */
const isGithubPages = process.env.GITHUB_PAGES === '1'
const basePath = isGithubPages ? '/ofc-gm' : ''

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  // 静态导出给 GitHub Pages；本地 dev / next start 仍走默认模式
  ...(isGithubPages
    ? {
        output: 'export' as const,
        basePath,
        assetPrefix: basePath || undefined,
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {
        cacheComponents: true,
        partialPrefetching: true,
      }),
  transpilePackages: ['@ofc-gm/framework'],
  turbopack: {
    resolveAlias: {
      '@ofc-gm/framework': resolve(__dirname, '../framework/src/index.ts'),
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@ofc-gm/framework': resolve(__dirname, '../framework/src/index.ts'),
    }
    return config
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
}

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
})

export default withMDX(nextConfig)
