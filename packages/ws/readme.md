# `@ofc-gm/ws`

WebSocket **信令中继**：双方约定一个房间名，开 **2 人房**，互相转发 SDP。  
不处理 WebRTC / ICE，只做配对与转发。

配合 `@ofc-gm/framework` 的 `PeerConnection`：

1. 双方约定 `roomId`（例如 `lunch-table-3`）
2. offer / answer 各自 `join` 该房间（满 2 人后第三人进不去）
3. offer `generateSDP()` → 发 `signal` → 服务端转给对方
4. answer `acceptRemoteSDP` → `generateSDP()` → 再 `signal` 回传
5. offer `acceptRemoteSDP(answer)` → DataChannel 连通

## 启动

```bash
pnpm dev:ws
# 或
pnpm --filter @ofc-gm/ws dev
```

默认：`ws://127.0.0.1:8787/signal`  
健康检查：`http://127.0.0.1:8787/health`

```bash
pnpm --filter @ofc-gm/ws dev -- --port 9000
```

## 协议（JSON）

### Client → Server

```json
{ "type": "join", "roomId": "demo", "role": "offer" }
{ "type": "signal", "sdp": { "type": "offer", "sdp": "..." } }
{ "type": "leave" }
{ "type": "ping" }
```

两人房里 `signal` 不写 `to` 即可，会转给房间里另一个人。

### Server → Client

```json
{ "type": "welcome", "peerId": "..." }
{ "type": "joined", "roomId": "demo", "peerId": "...", "peers": [] }
{ "type": "peer-joined", "peerId": "...", "role": "answer" }
{ "type": "signal", "from": "...", "sdp": { "type": "answer", "sdp": "..." } }
{ "type": "peer-left", "peerId": "..." }
{ "type": "error", "message": "房间已满（最多 2 人）" }
```

## 代码用法

```ts
import { createSignalServer } from '@ofc-gm/ws'

const server = createSignalServer({ port: 8787, maxPeersPerRoom: 2 })
await server.listen()
```
