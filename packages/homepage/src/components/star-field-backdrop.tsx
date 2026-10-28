'use client'

import { StarField } from 'retro-react'

/** 对齐 office-game root：全屏星空背景 */
export function StarFieldBackdrop() {
  return (
    <div className="starfield-backdrop" aria-hidden>
      <StarField numStars={1000} size={2} speed={1} starColor="white" />
    </div>
  )
}
