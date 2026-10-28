# ofc-gm

纯前端 WebRTC 小游戏 monorepo：办公室剪贴板信令 + 星型主机权威。

## 包

| 包 | 名 | 作用 |
|---|---|---|
| `packages/fst-framework` | `@ofc-gm/framework` | 信令、Host/Client Peer、双通道、App / Server·Client Module |
| `packages/fst-framework-ui` | `@ofc-gm/ui` | React「建主 / 加入」+ 文本信令面板 |
| `packages/demo-bomberman` | `@ofc-gm/demo-bomberman` | 泡泡堂风格 2～12 人对战 demo |

## 快速开始

```bash
pnpm install
pnpm dev:demo
```

浏览器请用 **同一局域网 HTTPS 地址** 开两端（例如 `https://192.168.x.x:5173`，手机与电脑都打开这个；自签证书需点一次继续）：

1. 窗口 A：`我要建主` → `生成加入 Offer` → 复制 Offer  
2. 窗口 B：`我要加入` → 粘贴 Offer → `生成 Answer` → 复制 Answer  
3. 窗口 A：粘贴 Answer → `确认 Answer`（可重复拉人，最多 12）  
4. 主机点 `开始游戏`

跨设备联机时，Vite 提供 `/__ofc/client-ip` 告知本机局域网 IP，用于把 Chrome mDNS 候选 `xxxx.local` 改写成真实 IP（若仍改成 `127.0.0.1`，手机永远连不上电脑）。同机双标签仍可用 `https://127.0.0.1:5173`。

单窗口调试可点 **本机联调（跳过 WebRTC）**（LocalLoopback，无真 P2P）。

## 框架用法（摘要）

```tsx
import App, { DEFAULT_RELIABLE, DEFAULT_UNRELIABLE } from '@ofc-gm/framework'
import { createConnector } from '@ofc-gm/ui'

const app = new App({
  maxPlayers: 12,
  channels: {
    reliable: DEFAULT_RELIABLE,       // 状态快照：有序可靠
    unreliable: DEFAULT_UNRELIABLE,   // 输入：无序、不重传 —— 可按游戏改
  },
  serverModule,
  clientModule,
})

const Connector = createConnector({ maxPlayers: 12 })

function Main() {
  const [step] = app.useStep(['connection', 'lobby', 'game'])
  useEffect(() => Connector.onConnection((server, socket) => {
    app.attachConnection(server, socket)
  }), [])
  return (
    <>
      {step === 'connection' && <Connector />}
      {step === 'game' && <GameView />}
    </>
  )
}
```

- **写玩法**：只关心 `ClientModule`（`sendInput` / `onState`）  
- **写逻辑**：只关心 `ServerModule`（权威 tick、碰撞）；源码可随 client 分发，**仅 Host tab 实例化运行**  
- **性能**：tick 频率、可靠/不可靠通道由开发者选择；框架不锁死插值或预测

## 信令格式

剪贴板文本前缀 `OFCGM1.` + Base64(JSON：SDP + 完整 ICE)。等待 ICE gathering 完成（最长约 120s），适配聊天工具慢交换。

本机互通注意：Chrome 会把 host 候选写成 `uuid.local`，手动粘贴后对端无法解析；`encodeBlob` / `decodeBlob` 已将其改写为 `127.0.0.1`。公网跨 NAT 可能需要自备 TURN（本阶段未内置）。

## LocalLoopback

```ts
import { createLocalLoopbackRoom } from '@ofc-gm/framework'
const room = createLocalLoopbackRoom({ maxPlayers: 12 })
const host = room.host
const client = room.createClient()
```

## 设计笔记

见 [packages/fst-framework/design/intro.md](packages/fst-framework/design/intro.md)。
