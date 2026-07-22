'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react'

type FieldErrors = Record<string, string[]>

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'One uppercase letter',  pass: /[A-Z]/.test(password) },
    { label: 'One number',            pass: /[0-9]/.test(password) },
  ]
  if (!password) return null
  return (
    <div className="mt-2 space-y-1">
      {checks.map(c => (
        <div key={c.label} className={`flex items-center gap-2 text-xs ${c.pass ? 'text-green-600' : 'text-charcoal/40'}`}>
          <Check className={`w-3 h-3 ${c.pass ? 'text-green-500' : 'text-charcoal/25'}`} />
          {c.label}
        </div>
      ))}
    </div>
  )
}

export default function RegisterPage() {
  const [form,    setForm]    = useState({ display_name: '', email: '', password: '', confirm_password: '' })
  const [errors,  setErrors]  = useState<FieldErrors>({})
  const [apiError,setApiError]= useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPw,  setShowPw]  = useState(false)
  const [showCpw, setShowCpw] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setErrors(er => ({ ...er, [k]: [] }))
    setApiError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setApiError('')
    setErrors({})

    try {
      const res  = await fetch('/api/v1/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()

      if (!data.success) {
        if (data.error?.details) setErrors(data.error.details)
        else setApiError(data.error?.message ?? 'Something went wrong. Please try again.')
        return
      }

      setSuccess(true)
    } catch {
      setApiError('Network error. Please check your connection and try again.')
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
        <h1 className="font-display text-2xl font-semibold text-navy mb-3">Check your email</h1>
        <p className="text-charcoal/60 font-body text-sm leading-relaxed mb-8">
          We've sent a verification link to <strong className="text-navy">{form.email}</strong>.
          Please click the link to activate your account.
        </p>
        <p className="text-xs text-charcoal/40 font-body">
          Didn't receive it?{' '}
          <button className="text-gold underline" onClick={() => setSuccess(false)}>Try again</button>
        </p>
      </div>
    )
  }

  const inputBase = 'w-full px-4 py-3 rounded-xl border font-body text-sm text-navy placeholder-charcoal/35 outline-none transition-all duration-200 bg-white'
  const inputNormal = `${inputBase} border-navy/15 focus:border-gold/60 focus:ring-2 focus:ring-gold/15`
  const inputError  = `${inputBase} border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100`

  const err = (field: string) => errors[field]?.[0]

  return (
    <>
      <h1 className="font-display text-3xl font-semibold text-navy mb-1">Create account</h1>
      <p className="text-charcoal/55 font-body text-sm mb-8">
        Free forever. No credit card required.
      </p>

      {apiError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-body">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">

        {/* Display name */}
        <div>
          <label className="block text-xs font-body font-medium text-navy/60 mb-1.5 tracking-wide uppercase">
            Your name
          </label>
          <input
            type="text" value={form.display_name} onChange={set('display_name')}
            placeholder="How should we address you?" autoComplete="name" autoFocus
            className={err('display_name') ? inputError : inputNormal}
          />
          {err('display_name') && <p className="mt-1 text-xs text-red-600">{err('display_name')}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-body font-medium text-navy/60 mb-1.5 tracking-wide uppercase">
            Email address
          </label>
          <input
            type="email" value={form.email} onChange={set('email')}
            placeholder="your@email.com" autoComplete="email"
            className={err('email') ? inputError : inputNormal}
          />
          {err('email') && <p className="mt-1 text-xs text-red-600">{err('email')}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-body font-medium text-navy/60 mb-1.5 tracking-wide uppercase">
            Password
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')}
              placeholder="Create a strong password" autoComplete="new-password"
              className={`${err('password') ? inputError : inputNormal} pr-12`}
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal/35 hover:text-navy transition-colors"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {err('password') && <p className="mt-1 text-xs text-red-600">{err('password')}</p>}
          <PasswordStrength password={form.password} />
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-xs font-body font-medium text-navy/60 mb-1.5 tracking-wide uppercase">
            Confirm password
          </label>
          <div className="relative">
            <input
              type={showCpw ? 'text' : 'password'} value={form.confirm_password} onChange={set('confirm_password')}
              placeholder="Repeat your password" autoComplete="new-password"
              className={`${err('confirm_password') ? inputError : inputNormal} pr-12`}
            />
            <button type="button" onClick={() => setShowCpw(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal/35 hover:text-navy transition-colors"
              aria-label={showCpw ? 'Hide password' : 'Show password'}
            >
              {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {err('confirm_password') && <p className="mt-1 text-xs text-red-600">{err('confirm_password')}</p>}
        </div>

        {/* Terms */}
        <p className="text-xs text-charcoal/45 font-body leading-relaxed">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="text-gold underline">Terms of Use</Link> and{' '}
          <Link href="/privacy" className="text-gold underline">Privacy Policy</Link>.
        </p>

        {/* Submit */}
        <button
          type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-navy hover:bg-navy-light disabled:opacity-60 disabled:cursor-not-allowed text-white font-body font-medium text-sm rounded-xl transition-all duration-200"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Create my account <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm font-body text-charcoal/50">
        Already have an account?{' '}
        <Link href="/login" className="text-gold font-medium hover:text-gold-dark transition-colors">
          Sign in
        </Link>
      </p>
    </>
  )
}
