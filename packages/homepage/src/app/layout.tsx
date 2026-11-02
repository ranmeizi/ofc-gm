import type { Metadata } from 'next'
import { ConnectStatus } from '@/components/connect-status'
import { SiteNav } from '@/components/site-nav'
import {
  StarFieldBackdrop,
  StarFieldToggle,
  StarfieldProvider,
} from '@/components/star-field-backdrop'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'OFC-GM',
    template: '%s · OFC-GM',
  },
  description:
    'OFC-GM — 办公室 Peer 小游戏框架。WebRTC DataChannel 直连，建房、信令、开玩。',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="zh-CN">
      <body>
        <StarfieldProvider>
          <div className="desktop">
            <StarFieldBackdrop />
            <header className="desktop-bar">
              <strong className="desktop-brand">OFC-GM</strong>
              <SiteNav />
              <div className="desktop-bar-end">
                <StarFieldToggle />
                <ConnectStatus />
              </div>
            </header>
            <main className="desktop-main">{children}</main>
          </div>
        </StarfieldProvider>
      </body>
    </html>
  )
}
