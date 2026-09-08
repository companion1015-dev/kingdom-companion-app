'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Menu, X, Search, User, LogOut, ChevronDown, LayoutDashboard, Shield,
  NotebookPen, UserPlus, Download,
} from 'lucide-react'
import { navMenu, authNavLinks, type NavEntry } from '@/data/mock'

// Real fix: this previously always showed a hardcoded "Sign in" button and
// never included Prayer Journal / Invite Friends / My Profile conditionally
// -- every signed-in user still saw "Sign in" regardless, and every signed-
// out visitor saw links that just led straight to a "please sign in" wall.
//
// Redesign: the old bar rendered all 14 top-level pages as one flat,
// horizontally-scrolling row (plus 4 more appended for signed-in users),
// which silently overflowed the fixed-height bar on real-world viewports.
// Replaced with a standard grouped nav -- a handful of primary links plus
// two labelled dropdown menus ("Grow", "Community") -- and moved the
// signed-in-only pages (Prayer Journal, Invite Friends) into the account
// dropdown instead of duplicating them in the main row.

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
  const [isAdmin,     setIsAdmin]     = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [accountOpen, setAccountOpen] = useState(false)
  const [openMenu,    setOpenMenu]    = useState<string | null>(null)
  const [canInstall,  setCanInstall]  = useState(false)
  // Mobile-only accordion state for the "Grow" / "Community" groups -- these
  // previously rendered as a plain, non-interactive label with the group's
  // links always shown beneath it, which looked like a dropdown but had no
  // tap behaviour at all. Now a real toggle, collapsed by default.
  const [openMobileGroups, setOpenMobileGroups] = useState<Set<string>>(new Set())
  const toggleMobileGroup = (label: string) => {
    setOpenMobileGroups(prev => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }
  const accountRef = useRef<HTMLDivElement>(null)
  const menuRefs   = useRef<Record<string, HTMLDivElement | null>>({})

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
        if (data.success) {
          setAuthed(true)
          setDisplayName(data.data.display_name || data.data.email)
          setIsAdmin(data.data.role === 'admin' || data.data.role === 'super_admin')
        }
      })
      .catch(() => { /* stay signed-out on any network failure */ })
  }, [])

  // Show a persistent "Install App" entry whenever the PWA is installable
  // and not already installed -- a quick, always-available way to install
  // rather than relying only on the once-in-a-while auto popup.
  useEffect(() => {
    try {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as { standalone?: boolean }).standalone === true
      const installed = standalone || localStorage.getItem('bc_installed') === '1'
      if (installed) { setCanInstall(false); return }

      // Real fix: this previously only showed the button on iOS immediately,
      // and on every other platform (including Android) waited for the
      // browser to actually fire beforeinstallprompt first. Chrome only
      // fires that event once its own engagement heuristic is satisfied --
      // which can take a while, or not happen in a short session at all --
      // so on Android the button (and the whole install feature) could
      // appear to simply not exist on mobile. Any mobile browser now shows
      // the button immediately; the tap handler already falls back to a
      // real manual-install guide when no beforeinstallprompt has fired
      // yet (see InstallPrompt.tsx), so it's never a dead end.
      const mobile = /iPad|iPhone|iPod|Android/.test(navigator.userAgent)
      setCanInstall(mobile)

      const onInstallable = () => setCanInstall(true)
      const onInstalled   = () => setCanInstall(false)
      window.addEventListener('beforeinstallprompt', onInstallable)
      window.addEventListener('appinstalled', onInstalled)
      return () => {
        window.removeEventListener('beforeinstallprompt', onInstallable)
        window.removeEventListener('appinstalled', onInstalled)
      }
    } catch { /* storage/matchMedia blocked -- leave hidden */ }
  }, [])

  const requestInstall = () => {
    window.dispatchEvent(new CustomEvent('kc:request-install'))
  }

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false)
      if (openMenu && !menuRefs.current[openMenu]?.contains(e.target as Node)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [openMenu])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpenMenu(null); setAccountOpen(false) } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    window.location.href = '/'
  }

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

          {/* Desktop nav — a handful of primary links plus two grouped
              dropdown menus, so the bar never overflows regardless of how
              many pages the app has. */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navMenu.map(entry => (
              <NavMenuItem
                key={entry.label}
                entry={entry}
                open={openMenu === entry.label}
                setOpen={open => setOpenMenu(open ? entry.label : null)}
                setRef={el => { menuRefs.current[entry.label] = el }}
              />
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-3">
            <button aria-label="Search" onClick={goToSearch} className="p-2 text-white/60 hover:text-white transition-colors rounded-md hover:bg-white/8 dark:bg-navy-dark">
              <Search className="w-4 h-4" />
            </button>

            {canInstall && (
              <button
                onClick={requestInstall}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gold/90 hover:text-gold bg-gold/10 hover:bg-gold/15 border border-gold/25 rounded-full transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Install App
              </button>
            )}

            {authed ? (
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccountOpen(o => !o)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/85 hover:text-white bg-white/8 dark:bg-navy-dark hover:bg-white/12 dark:bg-navy-dark rounded-full transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="max-w-[100px] truncate font-body">{displayName}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-navy-dark rounded-xl shadow-xl shadow-navy/15 border border-navy/8 overflow-hidden">
                    <Link href="/dashboard" onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-charcoal/70 dark:text-cream/70 hover:bg-navy/4 hover:text-navy dark:text-cream transition-colors font-body">
                      <LayoutDashboard className="w-3.5 h-3.5" /> My Dashboard
                    </Link>
                    <Link href="/journal" onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-charcoal/70 dark:text-cream/70 hover:bg-navy/4 hover:text-navy dark:text-cream transition-colors font-body">
                      <NotebookPen className="w-3.5 h-3.5" /> Prayer Journal
                    </Link>
                    <Link href="/invite" onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-charcoal/70 dark:text-cream/70 hover:bg-navy/4 hover:text-navy dark:text-cream transition-colors font-body">
                      <UserPlus className="w-3.5 h-3.5" /> Invite Friends
                    </Link>
                    <Link href="/profile" onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-charcoal/70 dark:text-cream/70 hover:bg-navy/4 hover:text-navy dark:text-cream transition-colors font-body border-t border-navy/8">
                      <User className="w-3.5 h-3.5" /> My Profile
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-charcoal/70 dark:text-cream/70 hover:bg-navy/4 hover:text-navy dark:text-cream transition-colors font-body border-t border-navy/8">
                        <Shield className="w-3.5 h-3.5" /> Admin Dashboard
                      </Link>
                    )}
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-body text-left border-t border-navy/8">
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 text-sm font-medium text-navy dark:text-cream bg-gold hover:bg-gold-light rounded-full transition-all duration-200"
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
        <div className="lg:hidden bg-navy-dark/98 backdrop-blur-md border-t border-white/10 max-h-[calc(100vh-4rem)] overflow-y-auto">
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
            {navMenu.map(entry => 'href' in entry ? (
              <Link
                key={entry.href}
                href={entry.href}
                className={`block px-4 py-3 hover:text-white hover:bg-white/8 dark:bg-navy-dark rounded-lg transition-all font-body text-sm ${entry.href === '/daily' ? 'text-gold/90 font-medium' : 'text-white/80'}`}
                onClick={() => setMenuOpen(false)}
              >
                {entry.label}
              </Link>
            ) : (
              <div key={entry.label} className="pt-2">
                <button
                  onClick={() => toggleMobileGroup(entry.label)}
                  aria-expanded={openMobileGroups.has(entry.label)}
                  className="w-full flex items-center justify-between px-4 pt-2 pb-1 text-[11px] font-body font-semibold text-white/35 hover:text-white/60 tracking-widest uppercase transition-colors"
                >
                  {entry.label}
                  <ChevronDown className={`w-3 h-3 transition-transform ${openMobileGroups.has(entry.label) ? 'rotate-180' : ''}`} />
                </button>
                {openMobileGroups.has(entry.label) && entry.items.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-4 py-3 text-white/80 hover:text-white hover:bg-white/8 dark:bg-navy-dark rounded-lg transition-all font-body text-sm"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}

            {canInstall && (
              <button
                onClick={() => { setMenuOpen(false); requestInstall() }}
                className="flex items-center gap-2 w-full px-4 py-3 text-gold/90 hover:text-gold hover:bg-white/8 dark:bg-navy-dark rounded-lg transition-all font-body text-sm font-medium"
              >
                <Download className="w-4 h-4" /> Install App
              </button>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-3 text-gold/90 hover:text-gold hover:bg-white/8 dark:bg-navy-dark rounded-lg transition-all font-body text-sm font-semibold"
                onClick={() => setMenuOpen(false)}
              >
                <Shield className="w-4 h-4" /> Admin Dashboard
              </Link>
            )}

            {authed && (
              <div className="pt-2">
                <p className="px-4 pt-2 pb-1 text-[11px] font-body font-semibold text-white/35 tracking-widest uppercase">Account</p>
                {authNavLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-3 text-white/80 hover:text-white hover:bg-white/8 dark:bg-navy-dark rounded-lg transition-all font-body text-sm"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

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
                  className="block w-full text-center px-4 py-3 text-sm font-medium text-navy dark:text-cream bg-gold hover:bg-gold-light rounded-full transition-colors"
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

function NavMenuItem({
  entry, open, setOpen, setRef,
}: {
  entry: NavEntry
  open: boolean
  setOpen: (open: boolean) => void
  setRef: (el: HTMLDivElement | null) => void
}) {
  if ('href' in entry) {
    const isDaily = entry.href === '/daily'
    return (
      <Link
        href={entry.href}
        className={`relative shrink-0 px-2.5 py-1.5 text-[13px] text-white/75 hover:text-white hover:bg-white/8 dark:bg-navy-dark rounded-md transition-all duration-200 font-body whitespace-nowrap ${isDaily ? 'text-gold/90 hover:text-gold font-medium' : ''}`}
      >
        {entry.label}
        {isDaily && (
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
        )}
      </Link>
    )
  }

  return (
    <div className="relative shrink-0" ref={setRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`flex items-center gap-1 px-2.5 py-1.5 text-[13px] rounded-md transition-all duration-200 font-body whitespace-nowrap ${open ? 'text-white bg-white/10' : 'text-white/75 hover:text-white hover:bg-white/8 dark:bg-navy-dark'}`}
      >
        {entry.label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-navy-dark rounded-xl shadow-xl shadow-navy/20 border border-navy/8 overflow-hidden py-1.5">
          {entry.items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 hover:bg-navy/4 transition-colors group/item"
            >
              <span className="block text-sm font-body font-medium text-navy dark:text-cream group-hover/item:text-gold-dark transition-colors">{item.label}</span>
              {item.description && (
                <span className="block text-xs text-charcoal/40 dark:text-cream/40 font-body mt-0.5">{item.description}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
