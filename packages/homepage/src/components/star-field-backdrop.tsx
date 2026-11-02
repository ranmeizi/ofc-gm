'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { Button, StarField } from 'retro-react'

const STORAGE_KEY = 'ofc-starfield'
const StarfieldContext = createContext<{
  enabled: boolean
  toggle: () => void
} | null>(null)

function readStored(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === null) return true
    return v !== '0'
  } catch {
    return true
  }
}

export function StarfieldProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(true)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setEnabled(readStored())
    setHydrated(true)
  }, [])

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  return (
    <StarfieldContext.Provider value={{ enabled: hydrated ? enabled : true, toggle }}>
      {children}
    </StarfieldContext.Provider>
  )
}

function useStarfield() {
  const ctx = useContext(StarfieldContext)
  if (!ctx) throw new Error('StarfieldProvider missing')
  return ctx
}

/** 对齐 office-game root：全屏星空背景 */
export function StarFieldBackdrop() {
  const { enabled } = useStarfield()
  if (!enabled) return null
  return (
    <div className="starfield-backdrop" aria-hidden>
      <StarField numStars={1000} size={2} speed={1} starColor="white" />
    </div>
  )
}

export function StarFieldToggle() {
  const { enabled, toggle } = useStarfield()
  return (
    <Button
      type="button"
      size="small"
      variant="flat"
      onClick={toggle}
      title={enabled ? '关闭星空背景' : '打开星空背景'}
    >
      {enabled ? '关星空' : '开星空'}
    </Button>
  )
}
