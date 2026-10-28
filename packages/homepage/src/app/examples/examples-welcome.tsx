'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Select, Text, TypewriterText } from 'retro-react'
import { EXAMPLE_PAGES, exampleHref } from '@/lib/docs'

export function ExamplesWelcome() {
  const router = useRouter()
  const [selectedGame, setSelectedGame] = useState('')

  return (
    <div
      style={{
        left: '50%',
        position: 'absolute',
        textAlign: 'center',
        top: '45%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        lineHeight: 2,
        zoom: 2,
      }}
    >
      <Text color="#ffffe0">OFC-GM</Text>
      <Text color="#ffffe0">Office WebRTC mini-games</Text>

      <TypewriterText
        color="#ffffe0"
        text="Pick an example and hit Start."
        cursor="_"
        erasingSpeed={40}
        pauseDuration={2000}
        repeat
        restartPause={1000}
        showCursor
        typingSpeed={80}
      />

      <Select
        sx={{ marginTop: '24px' }}
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

      <Button
        sx={{ marginTop: '24px' }}
        onClick={() => {
          if (!selectedGame) return
          router.push(exampleHref(selectedGame))
        }}
        size="medium"
        variant="primary"
        disabled={!selectedGame}
      >
        Start
      </Button>
    </div>
  )
}
