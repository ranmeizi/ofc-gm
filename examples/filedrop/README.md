# Filedrop（个人用）

仓库根目录 `examples/filedrop`，**不是** homepage 示例。

React + MUI + Vite：  

1. **交换房间码** — Host 生成 / Guest 填写  
2. **互传文件** — 左侧「我的」(琥珀拖放) / 右侧「对方」(青绿列表下载)

## 开发

```bash
# 另开终端信令
pnpm dev:ws

# 本应用
pnpm --filter @ofc-gm/example-filedrop dev
# → http://127.0.0.1:5177
```

或：

```bash
pnpm dev:filedrop
```

公网把 WSS 填成你部署的 `@ofc-gm/ws` 地址（`wss://…/signal`）。
