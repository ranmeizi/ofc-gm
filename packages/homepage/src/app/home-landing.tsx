'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button, Text, Window } from 'retro-react'

const INSTALL = `pnpm add @ofc-gm/framework
# 可选 UI
pnpm add @ofc-gm/components`

const SCENES = [
  {
    id: 'lan',
    title: 'lan-party.exe',
    kicker: '局域网',
    body: '同一 Wi‑Fi 下开房开玩。信令可粘贴，也可走 WebSocket。',
    x: 8,
    y: 12,
    w: 280,
  },
  {
    id: 'demo',
    title: 'demo-desk.exe',
    kicker: '演示 / 教学',
    body: '把 Peer 链路嵌进文档站、培训机、展台——仍是 Win9x 壳。',
    x: 42,
    y: 28,
    w: 300,
  },
  {
    id: 'lab',
    title: 'signal-lab.exe',
    kicker: '信令实验',
    body: '手动 SDP、STUN 探测、房间配对。框架不管 UI，你自己碰火花。',
    x: 22,
    y: 52,
    w: 290,
  },
] as const

function CopyInstall() {
  const [ok, setOk] = useState(false)
  return (
    <Button
      type="button"
      variant="primary"
      size="small"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(INSTALL)
          setOk(true)
          setTimeout(() => setOk(false), 1600)
        } catch {
          setOk(false)
        }
      }}
    >
      {ok ? '已复制' : '复制安装命令'}
    </Button>
  )
}

export function HomeLanding() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className={`home-shell${ready ? ' is-ready' : ''}`}>
      {/* —— Hero：一屏一构图 —— */}
      <section className="home-hero" aria-label="介绍">
        <div className="home-hero-copy">
          <p className="home-brand" aria-label="OFC-GM">
            OFC-GM
          </p>
          <h1 className="home-headline">办公室里的 Peer 小游戏框架</h1>
          <p className="home-lede">
            WebRTC DataChannel 直连。建房、交换信令、挂上 server / client
            模块——玩的时候不经过你的游戏服务器。
          </p>
          <div className="home-cta">
            <Link href="/docs/getting-started">
              <Button type="button" variant="primary" size="medium">
                安装 &amp; 开局
              </Button>
            </Link>
            <Link href="/examples">
              <Button type="button" variant="secondary" size="medium">
                打开 Examples
              </Button>
            </Link>
            <Link href="/docs">
              <Button type="button" variant="flat" size="medium">
                读文档
              </Button>
            </Link>
          </div>
        </div>

        <div className="home-hero-stage" aria-hidden>
          <div className="home-float home-float-a">
            <Window
              title="chat-room.exe"
              closable={false}
              draggable={false}
              resizable={false}
              defaultPosition={{ x: 0, y: 0 }}
              defaultSize={{ width: 260, height: 150 }}
              bounds={false}
              sx={{ position: 'relative' }}
            >
              <div className="home-win-body">
                <Text variant="small">host: 来了吗</Text>
                <Text variant="small">guest: 来了。直连的。</Text>
                <Text variant="small" color="#008000">
                  ● DataChannel open
                </Text>
              </div>
            </Window>
          </div>
          <div className="home-float home-float-b">
            <Window
              title="signal.bat"
              closable={false}
              draggable={false}
              resizable={false}
              defaultPosition={{ x: 0, y: 0 }}
              defaultSize={{ width: 240, height: 130 }}
              bounds={false}
              sx={{ position: 'relative' }}
            >
              <div className="home-win-body home-win-term">
                <div>{'>'} createHostSession()</div>
                <div>{'>'} acceptRemoteSignal(…)</div>
                <div>{'>'} whenReady() ✓</div>
              </div>
            </Window>
          </div>
          <div className="home-float home-float-c">
            <Window
              title="ofc.ini"
              closable={false}
              draggable={false}
              resizable={false}
              defaultPosition={{ x: 0, y: 0 }}
              defaultSize={{ width: 200, height: 110 }}
              bounds={false}
              sx={{ position: 'relative' }}
            >
              <div className="home-win-body">
                <Text variant="small">network=lan|internet</Text>
                <Text variant="small">role=offer|answer</Text>
                <Text variant="small">server ⊕ client</Text>
              </div>
            </Window>
          </div>
        </div>
      </section>

      {/* —— 使用场景：一节一件事 —— */}
      <section className="home-section" aria-labelledby="home-use-title">
        <div className="home-section-head">
          <h2 id="home-use-title" className="home-section-title">
            用在哪儿
          </h2>
          <p className="home-section-lede">三个土窗口，三种正经场景。</p>
        </div>

        <div className="home-scenes">
          {SCENES.map((s, i) => (
            <div
              key={s.id}
              className="home-scene"
              style={{
                ['--sx' as string]: `${s.x}%`,
                ['--sy' as string]: `${s.y}%`,
                ['--delay' as string]: `${0.08 * i}s`,
                maxWidth: s.w,
              }}
            >
              <Window
                title={s.title}
                closable={false}
                draggable={false}
                resizable={false}
                defaultPosition={{ x: 0, y: 0 }}
                bounds={false}
                sx={{ position: 'relative', width: '100%' }}
              >
                <div className="home-win-body">
                  <strong style={{ fontSize: 12, display: 'block' }}>{s.kicker}</strong>
                  <Text variant="paragraph">{s.body}</Text>
                </div>
              </Window>
            </div>
          ))}
        </div>
      </section>

      {/* —— 安装 —— */}
      <section className="home-section home-install" aria-labelledby="home-install-title">
        <div className="home-section-head">
          <h2 id="home-install-title" className="home-section-title">
            安装
          </h2>
          <p className="home-section-lede">一行进依赖，文档里把开局写完。</p>
        </div>

        <Window
          title="C:\\ofc-gm\\install.bat"
          closable={false}
          draggable={false}
          resizable={false}
          defaultPosition={{ x: 0, y: 0 }}
          bounds={false}
          sx={{ position: 'relative', width: 'min(560px, 100%)', margin: '0 auto' }}
        >
          <div className="home-win-body" style={{ display: 'grid', gap: 10 }}>
            <pre className="home-code">{INSTALL}</pre>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <CopyInstall />
              <Link href="/docs/getting-started">
                <Button type="button" variant="secondary" size="small">
                  看完整步骤
                </Button>
              </Link>
            </div>
          </div>
        </Window>
      </section>

      <footer className="home-foot">
        <span>@ofc-gm/framework · @ofc-gm/components</span>
        <span className="home-foot-sep">·</span>
        <a href="https://github.com/ranmeizi/ofc-gm">GitHub</a>
        <span className="home-foot-sep">·</span>
        <Link href="/examples">Examples</Link>
      </footer>
    </div>
  )
}
