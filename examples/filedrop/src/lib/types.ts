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

/** 实际选用的 ICE 路径（本端候选类型） */
export type IcePathKind = 'host' | 'srflx' | 'prflx' | 'relay' | 'unknown'

export type IcePathInfo = {
  kind: IcePathKind
  /** 给人看的短标签 */
  label: string
  localType: string
  remoteType: string
}
