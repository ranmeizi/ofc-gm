import { Alert, AlertTitle, Box } from '@mui/material'
import type { AppStatus } from '../lib/types'

const severityMap = {
  idle: 'info',
  info: 'info',
  ok: 'success',
  warn: 'warning',
  err: 'error',
} as const

export function StatusBanner({ status }: { status: AppStatus }) {
  if (status.kind === 'idle' && !status.text) return null
  return (
    <Box sx={{ mb: 2 }}>
      <Alert severity={severityMap[status.kind]} variant="outlined" sx={{ borderRadius: 3 }}>
        <AlertTitle sx={{ mb: 0, fontSize: 13 }}>{status.text}</AlertTitle>
      </Alert>
    </Box>
  )
}
