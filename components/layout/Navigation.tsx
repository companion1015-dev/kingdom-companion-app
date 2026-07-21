'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Search } from 'lucide-react'
import { navLinks } from '@/data/mock'

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.slice(0, 7).map(link => (
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
            <button aria-label="Search" className="p-2 text-white/60 hover:text-white transition-colors rounded-md hover:bg-white/8">
              <Search className="w-4 h-4" />
            </button>
            <Link
              href="/register"
              className="px-4 py-1.5 text-sm font-medium text-navy bg-gold hover:bg-gold-light rounded-full transition-all duration-200"
            >
              Sign in
            </Link>
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
            {navLinks.map(link => (
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
              <Link
                href="/register"
                className="block w-full text-center px-4 py-3 text-sm font-medium text-navy bg-gold hover:bg-gold-light rounded-full transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Create free account
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
