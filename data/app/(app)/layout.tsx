import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { template: '%s — Kingdom Companion', default: 'Kingdom Companion' },
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  )
}
