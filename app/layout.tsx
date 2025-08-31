import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
// import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Youtuber',
  description: 'Generate videos and upload to Youtube',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
          {children}
      </body>
    </html>
  )
}