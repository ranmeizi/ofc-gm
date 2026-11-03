import { useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  Container,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { StatusBanner } from './components/StatusBanner'
import { FiledropSession } from './lib/session'
import type { AppStatus, FileMeta, IcePathInfo, LocalFile, Role } from './lib/types'
import { ConnectStep } from './steps/ConnectStep'
import { TransferStep } from './steps/TransferStep'

type StepId = 0 | 1

const INITIAL_STATUS: AppStatus = { text: '', kind: 'idle' }

export default function App() {
  const sessionRef = useRef<FiledropSession | null>(null)
  const [step, setStep] = useState<StepId>(0)
  const [busy, setBusy] = useState(false)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [mine, setMine] = useState<LocalFile[]>([])
  const [peer, setPeer] = useState<FileMeta[]>([])
  const [icePath, setIcePath] = useState<IcePathInfo | null>(null)
  const [status, setStatus] = useState<AppStatus>(INITIAL_STATUS)
  const [resetKey, setResetKey] = useState(0)

  const session = useMemo(() => {
    const s = new FiledropSession({
      onStatus: (text, kind = 'info') => setStatus({ text, kind }),
      onProgress: (text) => setStatus({ text, kind: 'warn' }),
      onChannelOpen: () => {
        setBusy(false)
        setStep(1)
        setMine(sessionRef.current?.getMine() ?? [])
        setStatus({ text: '可以传文件了', kind: 'ok' })
      },
      onChannelClose: () => {
        setPeer([])
      },
      onPeerList: setPeer,
      onIcePath: setIcePath,
    })
    sessionRef.current = s
    return s
    // resetKey 变化时重建 session，彻底回到初始
  }, [resetKey])

  async function startAs(nextRole: Role, nextWs: string, nextRoom: string) {
    setBusy(true)
    setRole(nextRole)
    setRoomId(nextRoom)
    setPeer([])
    setIcePath(null)
    try {
      await session.connect(nextWs, nextRoom, nextRole)
    } catch {
      setBusy(false)
      setRole(null)
      setRoomId(null)
    }
  }

  function resetAll() {
    session.close(true)
    session.clearMine()
    setBusy(false)
    setStep(0)
    setRole(null)
    setRoomId(null)
    setMine([])
    setPeer([])
    setIcePath(null)
    setStatus(INITIAL_STATUS)
    setResetKey((k) => k + 1)
  }

  function leave() {
    resetAll()
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
        gap={2}
      >
        <Box sx={{ flex: 1 }} />
        <Typography
          variant="h3"
          component="h1"
          fontWeight={800}
          textAlign="center"
          sx={{ flex: 2 }}
        >
          传文件
        </Typography>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<RefreshIcon />}
            onClick={resetAll}
          >
            刷新
          </Button>
        </Box>
      </Stack>

      <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
        <Step completed={step > 0}>
          <StepLabel>生成 / 输入</StepLabel>
        </Step>
        <Step>
          <StepLabel>传文件</StepLabel>
        </Step>
      </Stepper>

      {status.text ? <StatusBanner status={status} /> : null}

      {step === 0 ? (
        <ConnectStep
          key={resetKey}
          busy={busy}
          roomId={roomId}
          role={role}
          onHost={(ws, room) => startAs('answer', ws, room)}
          onGuest={(ws, room) => startAs('offer', ws, room)}
          onCopyRoom={() => {
            if (!roomId) return
            void navigator.clipboard.writeText(roomId).then(
              () => setStatus({ text: '已复制', kind: 'ok' }),
              () => setStatus({ text: '复制失败', kind: 'err' }),
            )
          }}
        />
      ) : (
        <TransferStep
          mine={mine}
          peer={peer}
          icePath={icePath}
          onAdd={(files) => setMine(session.addFiles(files))}
          onRemove={(id) => setMine(session.removeFile(id))}
          onDownload={(f) => session.requestDownload(f)}
          onLeave={leave}
        />
      )}
    </Container>
  )
}
