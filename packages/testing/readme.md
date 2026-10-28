# `@ofc-gm/testing`

OFC 工程的交互 / 页面测试包（React 多路由）。

## 开发

```bash
pnpm --filter @ofc-gm/testing dev
```

默认 `http://0.0.0.0:5180`。

## 页面

| 路径 | 说明 |
|------|------|
| `/` | 测试页目录 |
| `/peer/manual-signal` | WebRTC 手动信令交换（对接 `PeerConnection`） |

适配层：`src/pages/peer-manual-signal/peerApi.ts`。

后续新测试：在 `src/pages/` 加页面，并在 `App.tsx` / `Home.tsx` 注册路由。
