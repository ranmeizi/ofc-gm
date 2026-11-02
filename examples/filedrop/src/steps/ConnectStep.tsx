import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { DEFAULT_WS, STORAGE_WS, randomRoom } from '../lib/utils'
import type { Role } from '../lib/types'

type Props = {
  busy: boolean
  roomId: string | null
  role: Role | null
  onHost: (wsUrl: string, roomId: string) => Promise<void>
  onGuest: (wsUrl: string, roomId: string) => Promise<void>
  onCopyRoom: () => void
}

function wsUrl() {
  return localStorage.getItem(STORAGE_WS) || DEFAULT_WS
}

export function ConnectStep({
  busy,
  roomId,
  role,
  onHost,
  onGuest,
  onCopyRoom,
}: Props) {
  const [guestCode, setGuestCode] = useState('')
  const code = useMemo(
    () => (roomId && role === 'answer' ? roomId : null),
    [roomId, role],
  )

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2.5,
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
      }}
    >
      <Card
        elevation={0}
        sx={{
          border: '1px solid rgba(232,168,56,0.35)',
          background:
            'linear-gradient(160deg, rgba(232,168,56,0.14) 0%, rgba(27,32,40,0.95) 42%)',
        }}
      >
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={800} mb={2}>
            生成！
          </Typography>

          {code ? (
            <Stack spacing={2} alignItems="center">
              <Typography
                sx={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: { xs: 36, md: 48 },
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  color: 'primary.light',
                }}
              >
                {code}
              </Typography>
              <Button
                size="large"
                variant="contained"
                startIcon={<ContentCopyIcon />}
                onClick={onCopyRoom}
              >
                复制
              </Button>
              <Typography color="text.secondary">发给对方，等他输入</Typography>
            </Stack>
          ) : (
            <Button
              variant="contained"
              size="large"
              disabled={busy}
              sx={{ minWidth: 160, py: 1.5, fontSize: 20 }}
              onClick={() => void onHost(wsUrl(), randomRoom())}
            >
              生成！
            </Button>
          )}
        </CardContent>
      </Card>

      <Card
        elevation={0}
        sx={{
          border: '1px solid rgba(61,184,168,0.35)',
          background:
            'linear-gradient(160deg, rgba(61,184,168,0.12) 0%, rgba(27,32,40,0.95) 42%)',
        }}
      >
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={800} mb={2}>
            输入！
          </Typography>
          <TextField
            fullWidth
            value={guestCode}
            disabled={busy}
            placeholder="对方的码"
            inputProps={{
              style: {
                fontFamily: '"IBM Plex Mono", monospace',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontWeight: 700,
                fontSize: 28,
                textAlign: 'center',
              },
            }}
            onChange={(e) => setGuestCode(e.target.value.toUpperCase())}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            color="secondary"
            size="large"
            disabled={busy || !guestCode.trim()}
            sx={{ minWidth: 160, py: 1.5, fontSize: 20 }}
            onClick={() => void onGuest(wsUrl(), guestCode.trim().toUpperCase())}
          >
            输入！
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}
