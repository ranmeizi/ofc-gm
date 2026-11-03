import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import { MinePanel } from '../components/MinePanel'
import { PeerPanel } from '../components/PeerPanel'
import type { FileMeta, IcePathInfo, LocalFile } from '../lib/types'

type Props = {
  mine: LocalFile[]
  peer: FileMeta[]
  icePath: IcePathInfo | null
  onAdd: (files: FileList) => void
  onRemove: (id: string) => void
  onDownload: (file: FileMeta) => void
  onLeave: () => void
}

function iceColor(kind: IcePathInfo['kind']) {
  if (kind === 'relay') return 'warning' as const
  if (kind === 'host') return 'success' as const
  if (kind === 'srflx' || kind === 'prflx') return 'info' as const
  return 'default' as const
}

export function TransferStep({
  mine,
  peer,
  icePath,
  onAdd,
  onRemove,
  onDownload,
  onLeave,
}: Props) {
  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2.5}
        gap={2}
        flexWrap="wrap"
      >
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
          <Typography variant="h4" fontWeight={800}>
            传文件！
          </Typography>
          {icePath ? (
            <Chip
              size="small"
              color={iceColor(icePath.kind)}
              label={icePath.label}
              title={`本端 ${icePath.localType} · 对端 ${icePath.remoteType}`}
            />
          ) : (
            <Chip size="small" variant="outlined" label="检测路径中…" />
          )}
        </Stack>
        <Button variant="text" color="inherit" onClick={onLeave}>
          退出
        </Button>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          alignItems: 'stretch',
        }}
      >
        <MinePanel files={mine} onAdd={onAdd} onRemove={onRemove} />
        <PeerPanel files={peer} onDownload={onDownload} />
      </Box>
    </Box>
  )
}
