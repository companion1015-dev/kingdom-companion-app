'use client'
import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Check, X, Trash2, Search, Loader2, ShieldAlert } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

type QueueItem = {
  id: string
  title: string
  content: string
  category: string
  privacy: string
  display_name: string | null
  moderation_status: 'pending' | 'approved' | 'hidden'
  created_at: string
  reviewed_at: string | null
  reviewer_notes: string | null
  user: { email: string } | null
  flagged: string[]
}

type StatusTab = 'pending' | 'approved' | 'hidden'

const TAB_LABELS: Record<StatusTab, string> = { pending: 'Pending', approved: 'Approved', hidden: 'Rejected' }
const TAB_COLORS: Record<StatusTab, string> = {
  pending:  'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  hidden:   'bg-red-100 text-red-800 border-red-200',
}

export default function AdminPrayerWallPage() {
  const [tab, setTab] = useState<StatusTab>('pending')
  const [items, setItems] = useState<QueueItem[]>([])
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [reviewing, setReviewing] = useState<QueueItem | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: tab })
      if (search.trim()) params.set('search', search.trim())
      const res = await fetch(`/api/v1/admin/prayer-wall/queue?${params}`, { credentials: 'include' })
      if (res.status === 403) { setForbidden(true); setLoading(false); return }
      const data = await res.json()
      if (data.success) {
        setItems(data.data.items)
        setCounts(data.data.counts)
      }
    } catch {
      /* leave existing state on network failure */
    } finally {
      setLoading(false)
    }
  }, [tab, search])

  useEffect(() => { load() }, [load])
  useEffect(() => { setSelected(new Set()) }, [tab])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const toggleSelect = (id: string) => {
    setSelected(s => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const toggleSelectAll = () => {
    setSelected(s => s.size === items.length ? new Set() : new Set(items.map(i => i.id)))
  }

  const singleAction = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/v1/admin/prayer-wall/${id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })
      const data = await res.json()
      if (data.success) {
        showToast(action === 'approve' ? 'Approved' : 'Rejected')
        setReviewing(null); setRejectReason('')
        load()
      } else {
        showToast(data.message ?? 'Something went wrong.')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const bulkAction = async (action: 'approve' | 'reject') => {
    if (selected.size === 0) return
    let reason: string | undefined
    if (action === 'reject') {
      reason = window.prompt('Reason for rejecting these posts:') ?? undefined
      if (!reason?.trim()) return
    }
    setActionLoading(true)
    try {
      const res = await fetch('/api/v1/admin/prayer-wall/bulk', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected), action, reason }),
      })
      const data = await res.json()
      if (data.success) {
        showToast(data.message)
        setSelected(new Set())
        load()
      } else {
        showToast(data.message ?? 'Something went wrong.')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const deleteItem = async (id: string) => {
    if (!window.confirm('Permanently remove this prayer request from the Prayer Wall?')) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/v1/admin/prayer-wall/${id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (data.success) { showToast('Deleted'); load() }
      else showToast(data.message ?? 'Something went wrong.')
    } finally {
      setActionLoading(false)
    }
  }

  if (forbidden) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-cream dark:bg-navy-dark pt-24 flex items-center justify-center">
          <div className="text-center max-w-sm px-4">
            <ShieldAlert className="w-10 h-10 text-navy/30 dark:text-cream/30 mx-auto mb-3" />
            <p className="font-display text-lg text-navy dark:text-cream mb-1">Admin access required</p>
            <p className="text-sm text-charcoal/50 dark:text-cream/50 font-body">This page is restricted to Kingdom Companion administrators.</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-cream dark:bg-navy-dark pt-16 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

          <h1 className="font-display text-2xl sm:text-3xl font-light text-navy dark:text-cream mb-2">Prayer Wall Moderation</h1>
          <p className="text-charcoal/50 dark:text-cream/50 font-body text-sm mb-6">
            Every post must be approved here before it appears on the public Prayer Wall.
          </p>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-6">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs font-body text-amber-800 leading-relaxed">
              Review all posts for personal info, donation requests, or inappropriate content before approving.
            </p>
          </div>

          {/* Tabs + counts */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(['pending', 'approved', 'hidden'] as StatusTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-full border text-xs font-body font-semibold transition-all ${
                  tab === t ? TAB_COLORS[t] : 'border-navy/12 text-charcoal/50 dark:text-cream/50 hover:border-navy/25'
                }`}>
                {TAB_LABELS[t]} · {t === 'hidden' ? counts.rejected : counts[t]}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30 dark:text-cream/30" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by keyword…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-navy/12 focus:border-gold/40 text-navy dark:text-cream font-body text-sm outline-none transition-all bg-white dark:bg-navy-dark"
            />
          </div>

          {/* Bulk actions */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-navy/4 border border-navy/10">
              <span className="text-xs font-body text-navy/60 dark:text-cream/60">{selected.size} selected</span>
              <button onClick={() => bulkAction('approve')} disabled={actionLoading}
                className="ml-auto px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-body font-semibold transition-colors disabled:opacity-50">
                Approve All
              </button>
              <button onClick={() => bulkAction('reject')} disabled={actionLoading}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-body font-semibold transition-colors disabled:opacity-50">
                Reject All
              </button>
            </div>
          )}

          {/* Table */}
          <div className="bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-navy/30 dark:text-cream/30 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <p className="text-center py-16 text-sm text-charcoal/40 dark:text-cream/40 font-body">No {TAB_LABELS[tab].toLowerCase()} prayer requests.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-navy/8 text-left">
                      <th className="p-3">
                        <input type="checkbox" checked={selected.size === items.length} onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-navy/20" />
                      </th>
                      <th className="p-3 font-body font-semibold text-navy/40 dark:text-cream/40 text-xs uppercase tracking-wider">Submitted</th>
                      <th className="p-3 font-body font-semibold text-navy/40 dark:text-cream/40 text-xs uppercase tracking-wider">Content Preview</th>
                      <th className="p-3 font-body font-semibold text-navy/40 dark:text-cream/40 text-xs uppercase tracking-wider">Privacy</th>
                      <th className="p-3 font-body font-semibold text-navy/40 dark:text-cream/40 text-xs uppercase tracking-wider hidden sm:table-cell">User</th>
                      <th className="p-3 font-body font-semibold text-navy/40 dark:text-cream/40 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id} className="border-b border-navy/5 last:border-0">
                        <td className="p-3">
                          <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)}
                            className="w-4 h-4 rounded border-navy/20" />
                        </td>
                        <td className="p-3 text-xs text-charcoal/50 dark:text-cream/50 font-body whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 max-w-xs">
                          <button onClick={() => setReviewing(item)} className="text-left hover:text-gold transition-colors">
                            <p className="font-body font-medium text-navy dark:text-cream text-sm truncate">{item.title}</p>
                            <p className="text-xs text-charcoal/40 dark:text-cream/40 font-body truncate">{item.content}</p>
                          </button>
                          {item.flagged.length > 0 && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] font-body font-semibold">
                              <AlertTriangle className="w-2.5 h-2.5" /> {item.flagged.join(', ')}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-xs text-charcoal/50 dark:text-cream/50 font-body capitalize">{item.privacy}</td>
                        <td className="p-3 text-xs text-charcoal/50 dark:text-cream/50 font-body hidden sm:table-cell">{item.user?.email ?? '—'}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {item.moderation_status === 'pending' && (
                              <>
                                <button onClick={() => singleAction(item.id, 'approve')} disabled={actionLoading}
                                  className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors" title="Approve">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setReviewing(item)} disabled={actionLoading}
                                  className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors" title="Reject">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            {item.moderation_status === 'approved' && (
                              <button onClick={() => deleteItem(item.id)} disabled={actionLoading}
                                className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Review modal */}
      {reviewing && (
        <>
          <div className="fixed inset-0 z-40 bg-navy/30 backdrop-blur-sm" onClick={() => { setReviewing(null); setRejectReason('') }} />
          <div className="fixed inset-x-3 bottom-0 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg z-50 bg-white dark:bg-navy-dark rounded-t-3xl sm:rounded-3xl shadow-2xl p-6">
            <h3 className="font-display text-lg font-semibold text-navy dark:text-cream mb-1">{reviewing.title}</h3>
            <p className="text-xs text-charcoal/40 dark:text-cream/40 font-body mb-4 capitalize">{reviewing.category} · {reviewing.privacy}</p>
            {reviewing.flagged.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-4">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs font-body text-red-600">Flagged: {reviewing.flagged.join(', ')}</p>
              </div>
            )}
            <p className="text-sm text-charcoal/70 dark:text-cream/70 font-body leading-relaxed mb-4 whitespace-pre-wrap">{reviewing.content}</p>

            {reviewing.moderation_status === 'pending' && (
              <>
                <textarea
                  value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection (required to reject)…" rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-navy/12 focus:border-gold/40 text-navy dark:text-cream font-body text-sm outline-none resize-none transition-all mb-4"
                />
                <div className="flex gap-3">
                  <button onClick={() => singleAction(reviewing.id, 'approve')} disabled={actionLoading}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-body font-semibold rounded-2xl transition-all disabled:opacity-50">
                    Approve
                  </button>
                  <button onClick={() => rejectReason.trim() && singleAction(reviewing.id, 'reject', rejectReason.trim())}
                    disabled={actionLoading || !rejectReason.trim()}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-body font-semibold rounded-2xl transition-all disabled:opacity-50">
                    Reject
                  </button>
                </div>
              </>
            )}
            {reviewing.reviewer_notes && (
              <p className="text-xs text-charcoal/40 dark:text-cream/40 font-body mt-3"><strong>Reviewer notes:</strong> {reviewing.reviewer_notes}</p>
            )}
          </div>
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-navy text-white text-sm font-body font-medium rounded-full shadow-xl">
          {toast}
        </div>
      )}
      <Footer />
    </>
  )
}