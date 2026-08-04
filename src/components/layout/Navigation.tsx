'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Search, User, LogOut, ChevronDown } from 'lucide-react'
import { navLinks, authNavLinks } from '@/data/mock'

// Real fix: this previously always showed a hardcoded "Sign in" button and
// never included Prayer Journal / Invite Friends / My Profile conditionally
// -- every signed-in user still saw "Sign in" regardless, and every signed-
// out visitor saw links that just led straight to a "please sign in" wall.

export default function Navigation() {
  const router = useRouter()
  const goToSearch = () => {
    const focusSearch = () => {
      document.getElementById('search-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      document.getElementById('bible-search-input')?.focus()
    }
    if (window.location.pathname === '/') {
      focusSearch()
    } else {
      router.push('/')
      setTimeout(focusSearch, 400)
    }
  }
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [scrolled,    setScrolled]    = useState(false)
  const [authed,      setAuthed]      = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    fetch('/api/v1/user/profile', { credentials: 'include' })
      .then(async res => {
        if (res.status === 401) return
        const data = await res.json()
        if (data.success) { setAuthed(true); setDisplayName(data.data.display_name || data.data.email) }
      })
      .catch(() => { /* stay signed-out on any network failure */ })
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    window.location.href = '/'
  }

  const allNavLinks = authed ? [...navLinks, ...authNavLinks] : navLinks

  const navBg = scrolled
    ? 'bg-navy/95 backdrop-blur-md shadow-lg shadow-navy-dark/40'
    : 'bg-transparent'

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">

          {/* Logo — official Kingdom Companion logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0" aria-label="Kingdom Companion — Home">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-navy-dark/30 group-hover:shadow-gold/30 transition-shadow duration-300">
              <Image
                src="/images/logo.png"
                alt="Kingdom Companion"
                fill
                className="object-cover"
                sizes="40px"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <span className="block font-display text-sm font-semibold text-white leading-tight tracking-wide">
                Kingdom Companion
              </span>
              <span className="block text-[9px] text-gold/75 tracking-[0.2em] uppercase font-body font-medium">
                Scripture · Peace · Purpose
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1 flex-wrap justify-end">
            {allNavLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm text-white/75 hover:text-white hover:bg-white/8 rounded-md transition-all duration-200 font-body"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-3">
            <button aria-label="Search" onClick={goToSearch} className="p-2 text-white/60 hover:text-white transition-colors rounded-md hover:bg-white/8">
              <Search className="w-4 h-4" />
            </button>

            {authed ? (
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccountOpen(o => !o)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/85 hover:text-white bg-white/8 hover:bg-white/12 rounded-full transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="max-w-[100px] truncate font-body">{displayName}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl shadow-navy/15 border border-navy/8 overflow-hidden">
                    <Link href="/profile" onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-charcoal/70 hover:bg-navy/4 hover:text-navy transition-colors font-body">
                      <User className="w-3.5 h-3.5" /> My Profile
                    </Link>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-body text-left">
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 text-sm font-medium text-navy bg-gold hover:bg-gold-light rounded-full transition-all duration-200"
              >
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 text-white/80 hover:text-white"
            onClick={() => setMenuOpen(o => !o)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-navy-dark/98 backdrop-blur-md border-t border-white/10">
          {/* Mobile logo strip */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/8">
            <div className="relative w-9 h-9 rounded-lg overflow-hidden">
              <Image src="/images/logo.png" alt="" fill className="object-cover" sizes="36px" />
            </div>
            <div>
              <p className="text-white text-sm font-display font-semibold">Kingdom Companion</p>
              <p className="text-gold/60 text-[9px] tracking-widest uppercase font-body">Rooted in Truth · Built for Life</p>
            </div>
          </div>
          <div className="px-4 py-3 space-y-1">
            {allNavLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-3 text-white/80 hover:text-white hover:bg-white/8 rounded-lg transition-all font-body text-sm"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-white/10">
              {authed ? (
                <button
                  onClick={() => { setMenuOpen(false); handleLogout() }}
                  className="block w-full text-center px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/register"
                  className="block w-full text-center px-4 py-3 text-sm font-medium text-navy bg-gold hover:bg-gold-light rounded-full transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Create free account
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
