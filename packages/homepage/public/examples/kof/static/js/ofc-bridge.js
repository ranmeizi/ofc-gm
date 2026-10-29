/**
 * 把 Magicherry KOF 的按键经 postMessage 交给父页 OFC Connection。
 * 父页协议：
 *   → iframe  { type: 'ofc-remote-keys', keys: string[] }
 *   ← parent  { type: 'ofc-local-keys', keys: string[] }
 *   → iframe  { type: 'ofc-ping' } / ← { type: 'ofc-ready' }
 */
export function bootOfcBridge(game) {
  const controller = game.game_map.controller

  window.__ofcOnLocalKeys = (physicalKeys) => {
    const abs = [...controller.physicalToAbstract(new Set(physicalKeys))]
    window.parent.postMessage({ type: 'ofc-local-keys', keys: abs }, '*')
  }

  window.addEventListener('message', (ev) => {
    const msg = ev.data
    if (!msg || typeof msg !== 'object') return
    if (msg.type === 'ofc-remote-keys' && Array.isArray(msg.keys)) {
      controller.setRemoteAbstract(msg.keys)
    }
  })

  window.parent.postMessage({ type: 'ofc-ready' }, '*')
}
