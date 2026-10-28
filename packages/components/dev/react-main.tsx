import { StrictMode, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { PeerConnection, type PeerNetwork, type PeerRole } from '@ofc-gm/framework'
import { OfcSignalExchange } from '@ofc-gm/components/react'

type Seat = {
  role: PeerRole
  network: PeerNetwork
  peer?: PeerConnection
}

function Demo() {
  const [seats, setSeats] = useState<Record<PeerRole, Seat>>({
    offer: { role: 'offer', network: 'lan' },
    answer: { role: 'answer', network: 'lan' },
  })
  const [modalRole, setModalRole] = useState<PeerRole | null>(null)
  const [log, setLog] = useState(
    'ready — 两边各自「创建 peer」再「打开 Modal」，复制粘贴连接码\n',
  )

  const append = (line: string) => {
    const t = new Date().toLocaleTimeString()
    setLog((prev) => `${prev}[${t}] ${line}\n`)
  }

  const sample = useMemo(
    () => `import { PeerConnection } from '@ofc-gm/framework'
import { OfcSignalExchange } from '@ofc-gm/components/react'

// 宿主创建
const peer = new PeerConnection()
peer.setNetwork('lan')
peer.setRole('offer')
peer.createPeer()

// 传给组件（Modal 内嵌）
<OfcSignalExchange peer={peer} onOpen={() => console.log('connected')} />`,
    [],
  )

  function createPeer(role: PeerRole) {
    setSeats((prev) => {
      prev[role].peer?.destroy()
      const peer = new PeerConnection()
      peer.setNetwork(prev[role].network)
      peer.setRole(role)
      peer.createPeer()
      append(`${role} · PeerConnection 已在页面创建（尚未传给组件）`)
      return {
        ...prev,
        [role]: { ...prev[role], peer },
      }
    })
  }

  function setNetwork(role: PeerRole, network: PeerNetwork) {
    setSeats((prev) => ({
      ...prev,
      [role]: { ...prev[role], network },
    }))
  }

  function openModal(role: PeerRole) {
    if (!seats[role].peer) {
      append(`${role} · 请先创建 peer`)
      return
    }
    setModalRole(role)
    append(`modal open · ${role} · peer 已传入组件`)
  }

  function closeModal() {
    setModalRole(null)
    append('modal closed · peer 仍由页面持有（未 destroy）')
  }

  const activePeer = modalRole ? seats[modalRole].peer : undefined

  return (
    <div
      style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '28px 16px 48px',
        fontFamily: '"PingFang SC", "Segoe UI", sans-serif',
        color: '#1c2430',
      }}
    >
      <h1 style={{ margin: '0 0 6px', fontSize: 20 }}>手动信令 Modal（React）</h1>
      <p style={{ margin: '0 0 16px', color: '#667788', fontSize: 13 }}>
        PeerConnection 由页面创建 → 传给{' '}
        <code>{'<OfcSignalExchange peer={peer} />'}</code> ·{' '}
        <a href="./index.html" style={{ color: '#667788' }}>
          ← Web Component 演示
        </a>
      </p>

      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        {(['offer', 'answer'] as PeerRole[]).map((role) => {
          const seat = seats[role]
          return (
            <section
              key={role}
              style={{
                background: '#fff',
                border: '1px solid #d8dee6',
                borderRadius: 14,
                padding: 14,
              }}
            >
              <h2 style={{ margin: '0 0 4px', fontSize: 15 }}>
                {role === 'offer' ? '发起方（offer）' : '接收方（answer）'}
              </h2>
              <p style={{ margin: '0 0 12px', color: '#667788', fontSize: 12 }}>
                宿主：new PeerConnection → setRole/setNetwork → createPeer → 传入组件
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <label>
                  network{' '}
                  <select
                    value={seat.network}
                    onChange={(e) => setNetwork(role, e.target.value as PeerNetwork)}
                  >
                    <option value="lan">lan</option>
                    <option value="internet">internet</option>
                  </select>
                </label>
                <button type="button" onClick={() => createPeer(role)}>
                  1. 创建 peer
                </button>
                <button
                  type="button"
                  disabled={!seat.peer}
                  onClick={() => openModal(role)}
                >
                  2. 打开 Modal
                </button>
              </div>
              <div
                style={{
                  font: '12px/1.4 ui-monospace, monospace',
                  color: seat.peer ? '#067647' : '#667788',
                }}
              >
                {seat.peer
                  ? `peer: 已创建 · role=${role} · network=${seat.network}`
                  : 'peer: 未创建'}
              </div>
            </section>
          )
        })}
      </div>

      {modalRole && activePeer ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 32, 0.45)',
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            zIndex: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div
            style={{
              width: 'min(560px, 100%)',
              background: '#fff',
              borderRadius: 16,
              padding: '18px 18px 16px',
              boxShadow: '0 16px 40px rgba(15, 23, 32, 0.18)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <strong>
                {modalRole === 'offer' ? '发起方' : '接收方'} · 连接设置
              </strong>
              <button type="button" onClick={closeModal}>
                关闭
              </button>
            </div>
            <OfcSignalExchange
              peer={activePeer}
              onOpen={() => append(`${modalRole} · channel open ✓`)}
              onAccept={() => append(`${modalRole} · accept ok`)}
              onCopy={(ok) => append(`${modalRole} · copy ${ok ? 'ok' : 'fail'}`)}
              onError={(err) =>
                append(
                  `${modalRole} · error: ${err instanceof Error ? err.message : String(err)}`,
                )
              }
            />
          </div>
        </div>
      ) : null}

      <pre
        style={{
          marginTop: 16,
          padding: 10,
          background: '#101820',
          color: '#d7e2ee',
          borderRadius: 8,
          font: '12px/1.45 ui-monospace, monospace',
          whiteSpace: 'pre-wrap',
        }}
      >
        {log}
      </pre>

      <pre
        style={{
          marginTop: 16,
          padding: 12,
          background: '#f7fafc',
          border: '1px solid #d8dee6',
          borderRadius: 8,
          fontSize: 12,
          overflow: 'auto',
        }}
      >
        {sample}
      </pre>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
)
