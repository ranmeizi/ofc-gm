import { Box, Button, Stack, Typography } from '@mui/material'
import { MinePanel } from '../components/MinePanel'
import { PeerPanel } from '../components/PeerPanel'
import type { FileMeta, LocalFile } from '../lib/types'

type Props = {
  mine: LocalFile[]
  peer: FileMeta[]
  onAdd: (files: FileList) => void
  onRemove: (id: string) => void
  onDownload: (file: FileMeta) => void
  onLeave: () => void
}

export function TransferStep({
  mine,
  peer,
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
      >
        <Typography variant="h4" fontWeight={800}>
          传文件！
        </Typography>
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
