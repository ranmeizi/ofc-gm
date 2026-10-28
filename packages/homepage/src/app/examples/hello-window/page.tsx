'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Box, Button, Text, Window } from 'retro-react'

export default function HelloWindowExample() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Link href="/examples" style={{ width: 'fit-content' }}>
        <Button type="button" variant="flat">
          ← Examples
        </Button>
      </Link>

      <Window
        title="hello-window.exe"
        closable={false}
        resizable
        defaultPosition={{ x: 0, y: 0 }}
        defaultSize={{ width: 420, height: 240 }}
        bounds={false}
        sx={{ position: 'relative' }}
      >
        <Box sx={{ padding: 14, display: 'grid', gap: 10 }}>
          <Text variant="h3">retro-react example</Text>
          <Text variant="paragraph">
            这是一个可交互示例页骨架。之后可以把 PeerConnection / 信令面板嵌进来。
          </Text>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button type="button" variant="primary" onClick={() => setCount((c) => c + 1)}>
              Click me
            </Button>
            <Text variant="body1">count = {count}</Text>
          </div>
        </Box>
      </Window>
    </div>
  )
}
