import Link from 'next/link'
import { Box, Button, Card, Text, Window } from 'retro-react'

export default function HomePage() {
  return (
    <Window
      title="Welcome — OFC-GM"
      closable={false}
      draggable={false}
      defaultPosition={{ x: 0, y: 0 }}
      bounds={false}
      sx={{ position: 'relative', width: 'min(640px, 100%)' }}
    >
      <Box sx={{ padding: 14, display: 'grid', gap: 12 }}>
        <Text variant="h2">Office WebRTC mini-games</Text>
        <Text variant="paragraph">
          文档用 MDX 静态生成；示例页用 retro-react 搭 Win9x 壳。框架本体在
          monorepo 的 <code>@ofc-gm/*</code> 包里。
        </Text>

        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          }}
        >
          <Card header="Docs">
            <Text variant="small" sx={{ display: 'block', marginBottom: 8 }}>
              写 MDX → 构建期 SSG
            </Text>
            <Link href="/docs">
              <Button type="button" variant="primary">
                Open Docs
              </Button>
            </Link>
          </Card>
          <Card header="Examples">
            <Text variant="small" sx={{ display: 'block', marginBottom: 8 }}>
              可交互 demo 页
            </Text>
            <Link href="/examples">
              <Button type="button" variant="secondary">
                Open Examples
              </Button>
            </Link>
          </Card>
        </div>
      </Box>
    </Window>
  )
}
