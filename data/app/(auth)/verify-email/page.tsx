'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, AlertTriangle, Loader } from 'lucide-react'

function VerifyEmailContent() {
  const params = useSearchParams()
  const token  = params.get('token') ?? ''
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Invalid verification link.'); return }

    fetch('/api/v1/auth/verify-email', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) { setStatus('success'); setMessage(data.message) }
        else              { setStatus('error');   setMessage(data.error?.message ?? 'Verification failed.') }
      })
      .catch(() => { setStatus('error'); setMessage('Network error. Please try again.') })
  }, [token])

  if (status === 'loading') return (
    <div className="text-center">
      <Loader className="w-10 h-10 text-navy/30 animate-spin mx-auto mb-4" />
      <p className="font-body text-sm text-charcoal/50">Verifying your email address…</p>
    </div>
  )

  if (status === 'success') return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-6">
        <Check className="w-7 h-7 text-green-500" />
      </div>
      <h1 className="font-display text-2xl font-semibold text-navy mb-3">Email verified!</h1>
      <p className="text-charcoal/60 font-body text-sm leading-relaxed mb-8">{message}</p>
      <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-navy hover:bg-navy-light text-white font-body font-medium text-sm rounded-full transition-colors">
        Sign in to your account →
      </Link>
    </div>
  )

  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="w-7 h-7 text-amber-500" />
      </div>
      <h1 className="font-display text-2xl font-semibold text-navy mb-3">Verification failed</h1>
      <p className="text-charcoal/60 font-body text-sm leading-relaxed mb-8">{message}</p>
      <Link href="/register" className="text-gold hover:text-gold-dark font-body text-sm font-medium transition-colors">
        Create a new account →
      </Link>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-charcoal/40 font-body text-sm text-center">Loading…</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
