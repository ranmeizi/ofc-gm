/**
 * 玩法模块约定：用户主要写这两份逻辑。
 * - ServerModule：权威（仅建房方挂载）
 * - ClientModule：表现 / 输入（建房方 + 加入方都挂载）
 */

export type ServerHandle = {
  /** 发给房间内所有座位（含本机 loopback） */
  broadcast(data: string | ArrayBuffer): void
  /** 发给指定 clientId */
  send(clientId: string, data: string | ArrayBuffer): void
  /** 当前座位 id 列表 */
  clients(): string[]
}

export type ClientHandle = {
  /** 发往权威（本机经 loopback，远端经 WebRTC） */
  send(data: string | ArrayBuffer): void
}

export type ServerModule = {
  onJoin?(server: ServerHandle, clientId: string): void
  onLeave?(server: ServerHandle, clientId: string): void
  onMessage?(server: ServerHandle, clientId: string, data: unknown): void
}

export type ClientModule = {
  onMessage?(data: unknown): void
  onConnect?(client: ClientHandle): void
  onClose?(): void
}
