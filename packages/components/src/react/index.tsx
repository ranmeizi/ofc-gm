import {
  createElement,
  useCallback,
  useEffect,
  useRef,
  type ReactElement,
} from 'react'
import type { OfcSignalPanel as OfcSignalPanelElement } from '../signal-panel.js'
import '../signal-panel.js'
import type { SignalPanelRole } from '../signal-panel.js'
import type { OfcSignalExchange as OfcSignalExchangeElement } from '../signal-exchange.js'
import '../signal-exchange.js'
import type { PeerConnection } from '@ofc-gm/framework'

export type { SignalPanelRole }

export type OfcSignalPanelProps = {
  localSignal?: string
  remoteSignal?: string
  role?: SignalPanelRole
  disabled?: boolean
  onAccept?: (value: string) => void
  onRemoteChange?: (value: string) => void
  onCopy?: (ok: boolean, error?: unknown) => void
}

/**
 * React 包装：底层仍是 <ofc-signal-panel> Web Component。
 */
export function OfcSignalPanel({
  localSignal = '',
  remoteSignal = '',
  role = '',
  disabled = false,
  onAccept,
  onRemoteChange,
  onCopy,
}: OfcSignalPanelProps): ReactElement {
  const ref = useRef<OfcSignalPanelElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.localSignal = localSignal
    el.remoteSignal = remoteSignal
    el.role = role
    el.disabled = disabled
  }, [localSignal, remoteSignal, role, disabled])

  const handleAccept = useCallback(
    (e: Event) => {
      const detail = (e as CustomEvent<{ value: string }>).detail
      onAccept?.(detail.value)
    },
    [onAccept],
  )

  const handleRemoteChange = useCallback(
    (e: Event) => {
      const detail = (e as CustomEvent<{ value: string }>).detail
      onRemoteChange?.(detail.value)
    },
    [onRemoteChange],
  )

  const handleCopy = useCallback(
    (e: Event) => {
      const detail = (e as CustomEvent<{ ok: boolean; error?: unknown }>).detail
      onCopy?.(detail.ok, detail.error)
    },
    [onCopy],
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('accept', handleAccept)
    el.addEventListener('remote-change', handleRemoteChange)
    el.addEventListener('copy', handleCopy)
    return () => {
      el.removeEventListener('accept', handleAccept)
      el.removeEventListener('remote-change', handleRemoteChange)
      el.removeEventListener('copy', handleCopy)
    }
  }, [handleAccept, handleRemoteChange, handleCopy])

  return createElement('ofc-signal-panel', { ref })
}

export type OfcSignalExchangeProps = {
  /** 外部创建好的 PeerConnection（已 setRole / createPeer） */
  peer?: PeerConnection
  onOpen?: () => void
  onClose?: () => void
  onMessage?: (data: unknown) => void
  onError?: (error: unknown) => void
  onAccept?: (detail: { role?: string }) => void
  onCopy?: (ok: boolean) => void
}

/** Modal 内嵌的手动信令交换面板（peer 由外部传入） */
export function OfcSignalExchange({
  peer,
  onOpen,
  onClose,
  onMessage,
  onError,
  onAccept,
  onCopy,
}: OfcSignalExchangeProps): ReactElement {
  const ref = useRef<OfcSignalExchangeElement | null>(null)
  const peerRef = useRef(peer)
  peerRef.current = peer

  const setRef = useCallback((el: OfcSignalExchangeElement | null) => {
    ref.current = el
    if (el) el.peer = peerRef.current
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.peer = peer
  }, [peer])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onOpenEv = () => onOpen?.()
    const onCloseEv = () => onClose?.()
    const onMessageEv = (e: Event) => onMessage?.((e as CustomEvent).detail)
    const onErrorEv = (e: Event) => onError?.((e as CustomEvent).detail)
    const onAcceptEv = (e: Event) =>
      onAccept?.((e as CustomEvent<{ role?: string }>).detail)
    const onCopyEv = (e: Event) => {
      const detail = (e as CustomEvent<{ ok: boolean }>).detail
      onCopy?.(detail.ok)
    }

    el.addEventListener('open', onOpenEv)
    el.addEventListener('close', onCloseEv)
    el.addEventListener('message', onMessageEv)
    el.addEventListener('error', onErrorEv)
    el.addEventListener('accept', onAcceptEv)
    el.addEventListener('copy', onCopyEv)
    return () => {
      el.removeEventListener('open', onOpenEv)
      el.removeEventListener('close', onCloseEv)
      el.removeEventListener('message', onMessageEv)
      el.removeEventListener('error', onErrorEv)
      el.removeEventListener('accept', onAcceptEv)
      el.removeEventListener('copy', onCopyEv)
    }
  }, [onOpen, onClose, onMessage, onError, onAccept, onCopy])

  return createElement('ofc-signal-exchange', { ref: setRef })
}
