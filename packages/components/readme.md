# `@ofc-gm/components`

Lit Web Components 基底 + React 薄包装。

## `<ofc-signal-exchange>`（Modal 用）

**PeerConnection 由外部创建**，组件只做手动交换连接码的 UI 与操作。

```ts
const peer = new PeerConnection()
peer.setNetwork('lan')
peer.setRole('offer')
peer.createPeer()

// Web Component
el.peer = peer

// React
<OfcSignalExchange peer={peer} onOpen={() => ...} />
```

- offer：自动生成「你的连接码」→ 复制 → 粘贴对方 → 确认连接  
- answer：粘贴对方 → 确认并生成我的连接码 → 复制回去  
- 关闭 Modal / 卸载组件 **不会** `destroy` 外部 peer

## 开发

```bash
pnpm --filter @ofc-gm/components dev
```

- WC Modal：`http://localhost:5181/`
- React Modal：`http://localhost:5181/react.html`
