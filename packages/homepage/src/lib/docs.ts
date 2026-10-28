export type DocPage = {
  /** URL 段；`[]` = `/docs` */
  slug: string[]
  title: string
  description?: string
  /** content/docs 下的文件名（无 .mdx） */
  file: string
}

export const DOC_PAGES: DocPage[] = [
  {
    slug: [],
    title: 'Overview',
    description: 'OFC-GM 文档与示例总览',
    file: 'index',
  },
  {
    slug: ['getting-started'],
    title: 'Getting Started',
    description: '安装、本地开发与包结构',
    file: 'getting-started',
  },
  {
    slug: ['framework', 'peer-connection'],
    title: 'PeerConnection',
    description: 'WebRTC 底层连接与 SDP 交换',
    file: 'framework/peer-connection',
  },
]

export function docsHref(slug: string[]) {
  return slug.length === 0 ? '/docs' : `/docs/${slug.join('/')}`
}

export function findDoc(slug: string[] | undefined) {
  const key = (slug ?? []).join('/')
  return DOC_PAGES.find((p) => p.slug.join('/') === key)
}

export type ExamplePage = {
  slug: string
  title: string
  description: string
}

export const EXAMPLE_PAGES: ExamplePage[] = [
  {
    slug: 'hello-window',
    title: 'Hello Window',
    description: '用 retro-react Window / Button 搭一个小窗口',
  },
]

export function exampleHref(slug: string) {
  return `/examples/${slug}`
}
