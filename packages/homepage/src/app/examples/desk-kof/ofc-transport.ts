'use client'

/** @deprecated 旧自研 desk-fighter 用；现已改 fork Magicherry + iframe ofc-bridge */
export type MkTransport = {
  init(): void
  emit(event: string, data?: unknown): void
  on(event: string, handler: (data?: unknown) => void): void
  destroy(): void
}
