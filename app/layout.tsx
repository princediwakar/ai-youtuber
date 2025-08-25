import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Universal YouTube Uploader',
  description: 'Upload any folder of videos to YouTube with smart playlists and descriptions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers session={undefined}>
          {children}
        </Providers>
      </body>
    </html>
  )
}