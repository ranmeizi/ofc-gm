import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { HomePage } from './pages/Home'
import { PeerManualSignalPage } from './pages/peer-manual-signal'
import { PeerWsSignalPage } from './pages/peer-ws-signal'

const TITLES: Record<string, { title: string; sub: string }> = {
  '/': {
    title: 'OFC Testing',
    sub: '手动 / 交互测试页集合',
  },
  '/peer/manual-signal': {
    title: 'Peer · 手动信令交换',
    sub: 'offer / answer 剪贴板交换，验证 WebRTC DataChannel',
  },
  '/peer/ws-signal': {
    title: 'Peer · WebSocket 信令交换',
    sub: '两人房自动转发 SDP，验证 WS + WebRTC DataChannel',
  },
}

export function App() {
  const { pathname } = useLocation()
  const meta = TITLES[pathname] ?? TITLES['/']!

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>{meta.title}</h1>
          <p>{meta.sub}</p>
        </div>
        {pathname !== '/' ? (
          <Link className="nav-home" to="/">
            ← 全部测试
          </Link>
        ) : null}
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/peer/manual-signal" element={<PeerManualSignalPage />} />
        <Route path="/peer/ws-signal" element={<PeerWsSignalPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
