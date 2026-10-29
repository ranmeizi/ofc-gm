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
    title: '介绍',
    description: 'OFC-GM 是什么',
    file: 'index',
  },
  {
    slug: ['getting-started'],
    title: '安装',
    description: '安装依赖与最小流程',
    file: 'getting-started',
  },
  {
    slug: ['framework', 'modules'],
    title: '写 server / client',
    description: '游戏逻辑与表现怎么拆',
    file: 'framework/modules',
  },
  {
    slug: ['framework', 'host-session'],
    title: '建立连接',
    description: 'createHostSession 交换信令',
    file: 'framework/host-session',
  },
  {
    slug: ['framework', 'start-host'],
    title: '开局',
    description: 'startHost 挂上模块开始玩',
    file: 'framework/start-host',
  },
  {
    slug: ['framework', 'peer-connection'],
    title: '自定义连接',
    description: '自己使用 PeerConnection',
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
  {
    slug: 'chat',
    title: '聊天室',
    description: 'Host / Guest 双座位文字聊天',
  },
  {
    slug: 'file-transfer',
    title: '文件传输',
    description: 'Host / Guest 互传文件并下载',
  },
  {
    slug: 'desk-kof',
    title: 'Desk KOF',
    description: 'Fork Magicherry KOF + 自绘角色 + OFC 按键同步',
  },
]

export function exampleHref(slug: string) {
  return `/examples/${slug}`
}
