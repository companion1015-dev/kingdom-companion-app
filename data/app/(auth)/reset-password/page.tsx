'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ArrowRight, Check, AlertTriangle } from 'lucide-react'

function ResetPasswordForm() {
  const params = useSearchParams()
  const token  = params.get('token') ?? ''

  const [form,     setForm]     = useState({ password: '', confirm_password: '' })
  const [showPw,   setShowPw]   = useState(false)
  const [showCpw,  setShowCpw]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (!token) setApiError('Invalid or missing reset link. Please request a new one.')
  }, [token])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setApiError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    if (form.password !== form.confirm_password) {
      setApiError('Passwords do not match.')
      return
    }
    setLoading(true)
    setApiError('')

    try {
      const res  = await fetch('/api/v1/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, ...form }),
      })
      const data = await res.json()

      if (data.success) {
        setSuccess(true)
      } else {
        setApiError(data.error?.message ?? 'Could not reset password. Please request a new link.')
      }
    } catch {
      setApiError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-6">
          <Check className="w-7 h-7 text-green-500" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-navy mb-3">Password updated</h1>
        <p className="text-charcoal/60 font-body text-sm leading-relaxed mb-8">
          Your password has been reset. You have been signed out of all devices for your security.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-navy hover:bg-navy-light text-white font-body font-medium text-sm rounded-full transition-colors"
        >
          Sign in with new password <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-navy mb-3">Invalid link</h1>
        <p className="text-charcoal/60 font-body text-sm mb-8">
          This password reset link is invalid or has expired.
        </p>
        <Link href="/forgot-password" className="text-gold hover:text-gold-dark font-body text-sm font-medium transition-colors">
          Request a new reset link →
        </Link>
      </div>
    )
  }

  const inputBase = 'w-full px-4 py-3 rounded-xl border border-navy/15 focus:border-gold/60 focus:ring-2 focus:ring-gold/15 font-body text-sm text-navy placeholder-charcoal/35 outline-none transition-all bg-white'

  return (
    <>
      <h1 className="font-display text-3xl font-semibold text-navy mb-2">Create new password</h1>
      <p className="text-charcoal/55 font-body text-sm mb-8">
        Choose a strong password for your account.
      </p>

      {apiError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-body">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-xs font-body font-medium text-navy/60 mb-1.5 tracking-wide uppercase">
            New password
          </label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')}
              placeholder="At least 8 characters" autoComplete="new-password" autoFocus
              className={`${inputBase} pr-12`}
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal/35 hover:text-navy transition-colors"
              aria-label={showPw ? 'Hide' : 'Show'}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-body font-medium text-navy/60 mb-1.5 tracking-wide uppercase">
            Confirm new password
          </label>
          <div className="relative">
            <input type={showCpw ? 'text' : 'password'} value={form.confirm_password} onChange={set('confirm_password')}
              placeholder="Repeat your password" autoComplete="new-password"
              className={`${inputBase} pr-12`}
            />
            <button type="button" onClick={() => setShowCpw(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal/35 hover:text-navy transition-colors"
              aria-label={showCpw ? 'Hide' : 'Show'}
            >
              {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-navy hover:bg-navy-light disabled:opacity-60 text-white font-body font-medium text-sm rounded-xl transition-all duration-200 mt-2"
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><span>Reset my password</span><ArrowRight className="w-4 h-4" /></>
          }
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-charcoal/40 font-body text-sm">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
