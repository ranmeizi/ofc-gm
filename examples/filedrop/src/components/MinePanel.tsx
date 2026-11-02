import { useRef, useState } from 'react'
import { Box, Button, IconButton, Stack, Typography } from '@mui/material'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import type { LocalFile } from '../lib/types'
import { fmtSize } from '../lib/utils'

type Props = {
  files: LocalFile[]
  disabled?: boolean
  onAdd: (files: FileList) => void
  onRemove: (id: string) => void
}

export function MinePanel({ files, disabled, onAdd, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 420,
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid rgba(232,168,56,0.4)',
        background:
          'linear-gradient(185deg, rgba(232,168,56,0.16) 0%, #1a1610 38%, #141210 100%)',
        boxShadow: '0 18px 50px rgba(0,0,0,0.35)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
        <Typography variant="h5" fontWeight={800}>
          我的文件
        </Typography>
      </Box>

      <Box
        onDragEnter={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setOver(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          if (disabled) return
          if (e.dataTransfer.files?.length) onAdd(e.dataTransfer.files)
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        sx={{
          mx: 2,
          mb: 2,
          py: 4,
          px: 2,
          borderRadius: 3,
          cursor: disabled ? 'default' : 'pointer',
          textAlign: 'center',
          border: '2px dashed',
          borderColor: over ? 'primary.main' : 'rgba(232,168,56,0.45)',
          background: over ? 'rgba(232,168,56,0.18)' : 'rgba(0,0,0,0.22)',
        }}
      >
        <CloudUploadOutlinedIcon sx={{ fontSize: 42, color: 'primary.light', mb: 1 }} />
        <Typography fontWeight={700} mb={1.5}>
          放文件
        </Typography>
        <Button
          variant="contained"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation()
            inputRef.current?.click()
          }}
        >
          添加
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) onAdd(e.target.files)
            e.target.value = ''
          }}
        />
      </Box>

      <Stack spacing={1} sx={{ px: 2, pb: 2, flex: 1, overflow: 'auto' }}>
        {files.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            空
          </Typography>
        ) : (
          files.map((f) => (
            <Box
              key={f.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                p: 1.25,
                borderRadius: 2.5,
                background: 'rgba(255,236,200,0.08)',
                border: '1px solid rgba(232,168,56,0.22)',
              }}
            >
              <InsertDriveFileOutlinedIcon sx={{ color: 'primary.light' }} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography noWrap fontWeight={600} fontSize={14}>
                  {f.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {fmtSize(f.size)}
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => onRemove(f.id)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ))
        )}
      </Stack>
    </Box>
  )
}
