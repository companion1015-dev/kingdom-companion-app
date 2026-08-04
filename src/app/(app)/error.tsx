'use client'

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="font-display text-2xl text-navy mb-3">Something went wrong</h1>
        <p className="font-body text-sm text-charcoal/60 mb-6">
          We hit a snag loading this page. Please try again, or head back home.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-5 py-2.5 border border-navy/20 text-navy rounded-lg text-sm font-medium hover:bg-navy/5 transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  )
}
