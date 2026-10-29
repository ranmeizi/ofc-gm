'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Select, Text, TypewriterText } from 'retro-react'
import { EXAMPLE_PAGES, exampleHref } from '@/lib/docs'
import { useDemoSession } from '@/hooks/use-demo-session'
import {
  METHOD_LABELS,
  type ConnectMethod,
  resetDemoSession,
} from '@/lib/demo-session'
import {
  ManualPanel,
  PostMessagePanel,
  StunPanel,
  WsPanel,
} from './connect/panels'

const METHODS: { id: ConnectMethod; hint: string; todo?: boolean }[] = [
  { id: 'ws', hint: '两人房自动转发 SDP（需 pnpm dev:ws）' },
  { id: 'manual', hint: '复制 / 粘贴 SDP 交换' },
  { id: 'stun', hint: '先探测公网 ICE，再手动交换' },
  { id: 'postmessage', hint: '同浏览器 Tab 信令', todo: true },
]

type Step = 'method' | 'connect' | 'example'

export function ExamplesWelcome() {
  const router = useRouter()
  const session = useDemoSession()
  const [step, setStep] = useState<Step>(() =>
    session.phase === 'connected' ? 'example' : 'method',
  )
  const [method, setMethod] = useState<ConnectMethod | ''>(session.method ?? '')
  const [selectedGame, setSelectedGame] = useState('')

  const connected = session.phase === 'connected'

  function pickMethod(id: ConnectMethod) {
    setMethod(id)
    setStep('connect')
  }

  function goExamples() {
    if (!connected) return
    setStep('example')
  }

  return (
    <div
      style={{
        left: '50%',
        position: 'absolute',
        textAlign: 'center',
        top: '42%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        lineHeight: 1.6,
        zoom: 1.35,
        width: 'min(520px, 92vw)',
      }}
    >
      <Text color="#ffffe0">OFC-GM</Text>
      <Text color="#ffffe0">Office WebRTC mini-games</Text>

      <TypewriterText
        color="#ffffe0"
        text={
          step === 'method'
            ? 'First, pick how to connect.'
            : step === 'connect'
              ? 'Finish signaling, then pick a game.'
              : 'Connection ready. Pick an example.'
        }
        cursor="_"
        erasingSpeed={40}
        pauseDuration={2200}
        repeat
        restartPause={800}
        showCursor
        typingSpeed={70}
      />

      {/* step 1: method */}
      {step === 'method' && (
        <div style={{ marginTop: 20, width: '100%', display: 'grid', gap: 8 }}>
          {METHODS.map((m) => (
            <Button
              key={m.id}
              type="button"
              variant="primary"
              size="medium"
              disabled={m.todo}
              onClick={() => pickMethod(m.id)}
              sx={{ width: '100%' }}
            >
              {METHOD_LABELS[m.id]}
              {m.todo ? ' (TODO)' : ''} — {m.hint}
            </Button>
          ))}
          {connected && (
            <Button type="button" variant="secondary" size="small" onClick={() => setStep('example')}>
              已连接，直接选游戏 →
            </Button>
          )}
        </div>
      )}

      {/* step 2: connect panel */}
      {step === 'connect' && method && (
        <div style={{ marginTop: 16, width: '100%' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text color="#ffffe0" variant="body1">
              {METHOD_LABELS[method]}
            </Text>
            <Button
              type="button"
              variant="flat"
              size="small"
              onClick={() => {
                resetDemoSession()
                setStep('method')
                setMethod('')
              }}
            >
              ← 重选方式
            </Button>
          </div>

          {method === 'ws' && <WsPanel />}
          {method === 'manual' && <ManualPanel />}
          {method === 'stun' && <StunPanel />}
          {method === 'postmessage' && <PostMessagePanel />}

          <Button
            type="button"
            variant="primary"
            size="medium"
            disabled={!connected}
            sx={{ marginTop: '16px' }}
            onClick={goExamples}
          >
            {connected ? '下一步：选择 Example' : '连通后可继续…'}
          </Button>
        </div>
      )}

      {/* step 3: pick example */}
      {step === 'example' && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {!connected && (
            <Text color="#ff8080" variant="small" sx={{ marginBottom: '8px' }}>
              尚未连接 — 请先完成信令
            </Text>
          )}
          <Select
            onChange={(e) => setSelectedGame(e.target.value)}
            size="medium"
            value={selectedGame}
            variant="terminal"
          >
            <>
              <option value="">Select example…</option>
              {EXAMPLE_PAGES.map((ex) => (
                <option key={ex.slug} value={ex.slug}>
                  {ex.title}
                </option>
              ))}
            </>
          </Select>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <Button
              type="button"
              variant="flat"
              size="medium"
              onClick={() => setStep(connected ? 'connect' : 'method')}
            >
              ← 连接
            </Button>
            <Button
              type="button"
              variant="primary"
              size="medium"
              disabled={!selectedGame || (!connected && selectedGame !== 'hello-window')}
              onClick={() => {
                if (!selectedGame) return
                router.push(exampleHref(selectedGame))
              }}
            >
              Start
            </Button>
          </div>
          <Text color="#c0c0c0" variant="small" sx={{ marginTop: '10px' }}>
            hello-window 可不连；聊天 / 传文件需要 CONNECT=已连接
          </Text>
        </div>
      )}
    </div>
  )
}
