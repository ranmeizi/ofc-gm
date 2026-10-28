# homepage

OFC-GM 文档站 + Examples（Next.js App Router · MDX · SSG · retro-react）。

## 开发

```bash
pnpm dev:home
# http://localhost:3000
```

## 怎么加文档

1. 在 `src/content/docs/` 写 `.mdx`
2. 在 `src/lib/docs.ts` 的 `DOC_PAGES` 登记 `slug` / `title` / `file`
3. 打开 `/docs/...` 即可（`generateStaticParams` 会 SSG）

## 怎么加 Example

1. 新建 `src/app/examples/<slug>/page.tsx`
2. 在 `EXAMPLE_PAGES` 登记
3. 列表页 `/examples` 会自动出现入口

## 路由

| 路径 | 说明 |
| --- | --- |
| `/` | 首页 |
| `/docs` | 文档 Overview |
| `/docs/getting-started` | 入门 |
| `/docs/framework/peer-connection` | PeerConnection |
| `/examples` | 示例列表 |
| `/examples/hello-window` | retro-react 窗口示例 |
