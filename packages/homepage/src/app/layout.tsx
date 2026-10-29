import type { Metadata } from 'next'
import { ConnectStatus } from '@/components/connect-status'
import { SiteNav } from '@/components/site-nav'
import { StarFieldBackdrop } from '@/components/star-field-backdrop'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'OFC-GM',
    template: '%s · OFC-GM',
  },
  description: 'Office WebRTC mini-game framework — docs & examples',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="desktop">
          <StarFieldBackdrop />
          <header className="desktop-bar">
            <strong className="desktop-brand">OFC-GM</strong>
            <SiteNav />
            <ConnectStatus />
          </header>
          <main className="desktop-main">{children}</main>
        </div>
      </body>
    </html>
  )
}
