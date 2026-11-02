import { useMemo, useRef, useState } from 'react'
import {
  Box,
  Container,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material'
import { StatusBanner } from './components/StatusBanner'
import { FiledropSession } from './lib/session'
import type { AppStatus, FileMeta, LocalFile, Role } from './lib/types'
import { ConnectStep } from './steps/ConnectStep'
import { TransferStep } from './steps/TransferStep'

type StepId = 0 | 1

export default function App() {
  const sessionRef = useRef<FiledropSession | null>(null)
  const [step, setStep] = useState<StepId>(0)
  const [busy, setBusy] = useState(false)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [mine, setMine] = useState<LocalFile[]>([])
  const [peer, setPeer] = useState<FileMeta[]>([])
  const [status, setStatus] = useState<AppStatus>({
    text: '',
    kind: 'idle',
  })

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
    })
    sessionRef.current = s
    return s
  }, [])

  async function startAs(nextRole: Role, nextWs: string, nextRoom: string) {
    setBusy(true)
    setRole(nextRole)
    setRoomId(nextRoom)
    setPeer([])
    try {
      await session.connect(nextWs, nextRoom, nextRole)
    } catch {
      setBusy(false)
      setRole(null)
      setRoomId(null)
    }
  }

  function leave() {
    session.close(true)
    setBusy(false)
    setStep(0)
    setRole(null)
    setRoomId(null)
    setPeer([])
    setStatus({ text: '', kind: 'idle' })
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Box mb={3} textAlign="center">
        <Typography variant="h3" component="h1" fontWeight={800}>
          传文件
        </Typography>
      </Box>

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
          onAdd={(files) => setMine(session.addFiles(files))}
          onRemove={(id) => setMine(session.removeFile(id))}
          onDownload={(f) => session.requestDownload(f)}
          onLeave={leave}
        />
      )}
    </Container>
  )
}
