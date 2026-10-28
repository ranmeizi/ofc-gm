import { Link } from 'react-router-dom'

const TESTS = [
  {
    to: '/peer/manual-signal',
    title: 'Peer · 手动信令交换',
    desc: '选角色 / 网络档 → 生成本地 SDP → 剪贴板交换 → Accept 对端信令',
  },
  {
    to: '/peer/ws-signal',
    title: 'Peer · WebSocket 信令交换',
    desc: '约定房间名 → 两人房自动转发 SDP（需 pnpm dev:ws）',
  },
]

export function HomePage() {
  return (
    <section className="panel">
      <h2>Test Pages</h2>
      <div className="test-list">
        {TESTS.map((t) => (
          <Link key={t.to} className="test-card" to={t.to}>
            <strong>{t.title}</strong>
            <span>{t.desc}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
