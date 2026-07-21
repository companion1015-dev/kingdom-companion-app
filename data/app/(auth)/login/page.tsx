'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [form,     setForm]     = useState({ email: '', password: '' })
  const [apiError, setApiError] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPw,   setShowPw]   = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setApiError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email || !form.password) {
      setApiError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setApiError('')

    try {
      const res  = await fetch('/api/v1/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
        credentials: 'include',
      })
      const data = await res.json()

      if (!data.success) {
        setApiError(data.error?.message ?? 'Sign in failed. Please try again.')
        return
      }

      // Redirect to homepage (or saved redirect destination)
      window.location.href = '/'

    } catch {
      setApiError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputBase   = 'w-full px-4 py-3 rounded-xl border font-body text-sm text-navy placeholder-charcoal/35 outline-none transition-all duration-200 bg-white'
  const inputNormal = `${inputBase} border-navy/15 focus:border-gold/60 focus:ring-2 focus:ring-gold/15`

  return (
    <>
      <h1 className="font-display text-3xl font-semibold text-navy mb-1">Welcome back</h1>
      <p className="text-charcoal/55 font-body text-sm mb-8">
        Sign in to continue your spiritual journey.
      </p>

      {apiError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-body" role="alert">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">

        <div>
          <label className="block text-xs font-body font-medium text-navy/60 mb-1.5 tracking-wide uppercase">
            Email address
          </label>
          <input
            type="email" value={form.email} onChange={set('email')}
            placeholder="your@email.com" autoComplete="email" autoFocus
            className={inputNormal}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-body font-medium text-navy/60 tracking-wide uppercase">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-gold hover:text-gold-dark transition-colors font-body">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')}
              placeholder="Your password" autoComplete="current-password"
              className={`${inputNormal} pr-12`}
            />
            <button
              type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal/35 hover:text-navy transition-colors"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-navy hover:bg-navy-light disabled:opacity-60 disabled:cursor-not-allowed text-white font-body font-medium text-sm rounded-xl transition-all duration-200 mt-2"
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><span>Sign in</span><ArrowRight className="w-4 h-4" /></>
          }
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-navy/8" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-cream px-4 text-xs text-charcoal/35 font-body">or continue without an account</span>
        </div>
      </div>

      <Link
        href="/bible"
        className="w-full flex items-center justify-center gap-2 py-3.5 border border-navy/15 hover:border-navy/30 text-navy/70 hover:text-navy font-body font-medium text-sm rounded-xl transition-all duration-200"
      >
        📖 Read the Bible — no account needed
      </Link>

      <p className="mt-6 text-center text-sm font-body text-charcoal/50">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-gold font-medium hover:text-gold-dark transition-colors">
          Create one free
        </Link>
      </p>
    </>
  )
}
