# Filedrop

```bash
pnpm --filter @ofc-gm/example-filedrop dev      # 开发
pnpm --filter @ofc-gm/example-filedrop build    # 产出 dist/
pnpm --filter @ofc-gm/example-filedrop preview  # 本地预览 dist
```

**上线只部署 `examples/filedrop/dist/`**，不要挂源码里的 `index.html`（里面是 `/src/main.tsx`，静态服务器会回 HTML → MIME 报错）。
