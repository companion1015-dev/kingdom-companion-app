import type { Metadata, Viewport } from 'next'
import dynamic from 'next/dynamic'
import '@/styles/globals.css'

const PWAProvider = dynamic(() => import('@/modules/pwa/components/PWAProvider'), { ssr: false })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://kingdom-companion.vercel.app'),
  title: {
    default: 'Kingdom Companion — Scripture. Encouragement. Peace. Purpose.',
    template: '%s | Kingdom Companion',
  },
  description: 'An AI-powered Christian platform. Read the Bible, receive Scripture-centred encouragement, follow devotionals, and grow spiritually. Rooted in Truth. Built for Life.',
  keywords: ['Bible', 'devotional', 'Scripture', 'prayer', 'Christian', 'faith', 'reading plans', 'Jesus', 'God'],
  authors: [{ name: 'Kingdom Companion' }],
  creator: 'Kingdom Companion',
  openGraph: {
    type: 'website', locale: 'en_US', siteName: 'Kingdom Companion',
    title: 'Kingdom Companion',
    description: 'Rooted in Truth. Built for Life.',
    images: [{ url: '/images/logo.png', width: 1254, height: 1254, alt: 'Kingdom Companion' }],
  },
  twitter: { card: 'summary_large_image', title: 'Kingdom Companion', description: 'Scripture. Encouragement. Peace. Purpose.', images: ['/images/logo.png'] },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' }, { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
  appleWebApp: {
    capable: true, statusBarStyle: 'black-translucent', title: 'Kingdom Companion',
    startupImage: [
      { url: '/icons/splash-2048x2732.png', media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)' },
      { url: '/icons/splash-1290x2796.png', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)' },
      { url: '/icons/splash-1179x2556.png', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)' },
      { url: '/icons/splash-1170x2532.png', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)' },
      { url: '/icons/splash-750x1334.png',  media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1B3A5C' },
    { media: '(prefers-color-scheme: dark)',  color: '#0f2236' },
  ],
  width: 'device-width', initialScale: 1, maximumScale: 5, userScalable: true,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-cream font-body antialiased">
        <PWAProvider>
          {children}
        </PWAProvider>
      </body>
    </html>
  )
}
