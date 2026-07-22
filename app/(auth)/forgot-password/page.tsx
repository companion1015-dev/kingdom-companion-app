'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email,    setEmail]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [sent,     setSent]     = useState(false)
  const [apiError, setApiError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setApiError('Please enter your email address.'); return }
    setLoading(true)
    setApiError('')

    try {
      const res  = await fetch('/api/v1/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) {
        setSent(true)
      } else {
        setApiError(data.error?.message ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setApiError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-7 h-7 text-blue-400" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-navy mb-3">Check your inbox</h1>
        <p className="text-charcoal/60 font-body text-sm leading-relaxed mb-2">
          If an account exists for <strong className="text-navy">{email}</strong>, a password reset link has been sent.
        </p>
        <p className="text-charcoal/40 font-body text-xs mb-8">
          The link expires in one hour. Please check your spam folder if you don&apos;t see it.
        </p>
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-body text-gold hover:text-gold-dark transition-colors">
          <ArrowLeft className="w-4 h-4" /> Return to sign in
        </Link>
      </div>
    )
  }

  return (
    <>
      <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-body text-charcoal/45 hover:text-navy transition-colors mb-8">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
      </Link>

      <h1 className="font-display text-3xl font-semibold text-navy mb-2">Reset password</h1>
      <p className="text-charcoal/55 font-body text-sm mb-8 leading-relaxed">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

      {apiError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-body">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label className="block text-xs font-body font-medium text-navy/60 mb-1.5 tracking-wide uppercase">
            Email address
          </label>
          <input
            type="email" value={email} onChange={e => { setEmail(e.target.value); setApiError('') }}
            placeholder="your@email.com" autoComplete="email" autoFocus
            className="w-full px-4 py-3 rounded-xl border border-navy/15 focus:border-gold/60 focus:ring-2 focus:ring-gold/15 font-body text-sm text-navy placeholder-charcoal/35 outline-none transition-all bg-white"
          />
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-navy hover:bg-navy-light disabled:opacity-60 text-white font-body font-medium text-sm rounded-xl transition-all duration-200"
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><span>Send reset link</span><ArrowRight className="w-4 h-4" /></>
          }
        </button>
      </form>
    </>
  )
}
