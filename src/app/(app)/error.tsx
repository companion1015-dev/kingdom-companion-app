'use client'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ padding: 40, fontFamily: 'monospace', background: '#fff', color: '#c00' }}>
      <h1>Debug: Client Error Caught</h1>
      <p><strong>Message:</strong> {error.message}</p>
      <p><strong>Digest:</strong> {error.digest || 'none'}</p>
      <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, background: '#f5f5f5', padding: 12 }}>
        {error.stack}
      </pre>
      <button onClick={() => reset()} style={{ marginTop: 20, padding: '8px 16px' }}>
        Try again
      </button>
    </div>
  )
}
