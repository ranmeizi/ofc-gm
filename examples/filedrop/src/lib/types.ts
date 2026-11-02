export type Role = 'answer' | 'offer'

export type FileMeta = {
  id: string
  name: string
  size: number
  mime: string
}

export type LocalFile = FileMeta & {
  blob: Blob
}

export type StatusKind = 'idle' | 'info' | 'ok' | 'warn' | 'err'

export type AppStatus = {
  text: string
  kind: StatusKind
}
