import { Box, Button, Stack, Typography } from '@mui/material'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import type { FileMeta } from '../lib/types'
import { fmtSize } from '../lib/utils'

type Props = {
  files: FileMeta[]
  disabled?: boolean
  onDownload: (file: FileMeta) => void
}

export function PeerPanel({ files, disabled, onDownload }: Props) {
  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 420,
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid rgba(61,184,168,0.4)',
        background:
          'linear-gradient(185deg, rgba(61,184,168,0.14) 0%, #10181a 40%, #0e1416 100%)',
        boxShadow: '0 18px 50px rgba(0,0,0,0.35)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ px: 2.5, pt: 2.5, pb: 2, borderBottom: '1px solid rgba(61,184,168,0.2)' }}>
        <Typography variant="h5" fontWeight={800}>
          对方文件
        </Typography>
      </Box>

      <Stack spacing={0} sx={{ flex: 1, overflow: 'auto' }}>
        {files.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              空
            </Typography>
          </Box>
        ) : (
          files.map((f, i) => (
            <Box
              key={f.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 1.5,
                alignItems: 'center',
                px: 2.25,
                py: 1.75,
                borderBottom: '1px solid rgba(61,184,168,0.12)',
                background: i % 2 === 0 ? 'rgba(61,184,168,0.04)' : 'transparent',
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap fontWeight={600}>
                  {f.name}
                </Typography>
                <Typography variant="caption" color="secondary.light">
                  {fmtSize(f.size)}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="contained"
                color="secondary"
                disabled={disabled}
                startIcon={<DownloadRoundedIcon />}
                onClick={() => onDownload(f)}
              >
                下载
              </Button>
            </Box>
          ))
        )}
      </Stack>
    </Box>
  )
}
