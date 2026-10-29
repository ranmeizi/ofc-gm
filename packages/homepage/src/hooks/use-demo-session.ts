'use client'

import { useSyncExternalStore } from 'react'
import {
  getDemoSession,
  subscribeDemoSession,
  type DemoSessionSnapshot,
} from '@/lib/demo-session'

export function useDemoSession(): DemoSessionSnapshot {
  return useSyncExternalStore(subscribeDemoSession, getDemoSession, getDemoSession)
}
