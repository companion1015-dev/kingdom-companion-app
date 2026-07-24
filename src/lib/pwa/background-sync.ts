// ─── BACKGROUND SYNC SERVICE ──────────────────────────────────────────────────
// Architecture Spec §7.5 | Submitted spec: Background Sync Requirements
// IndexedDB for offline storage → automatic sync when connection restored
// Conflict resolution: last-write-wins with timestamp comparison (SAD §3.16)

const DB_NAME    = 'bc_sync_db'
const DB_VERSION = 1
const QUEUE_STORE = 'sync_queue'
const DATA_STORE  = 'offline_data'

export type SyncAction = {
  id:        string
  type:      'highlight' | 'bookmark' | 'note' | 'prayer' | 'reading_progress'
  operation: 'create' | 'update' | 'delete'
  payload:   Record<string, unknown>
  timestamp: number
  retries:   number
  maxRetries:number
}

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error'

// ─── IndexedDB initialisation ─────────────────────────────────────────────────

let db: IDBDatabase | null = null

export async function initSyncDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Sync queue store — pending actions waiting for network
      if (!database.objectStoreNames.contains(QUEUE_STORE)) {
        const queueStore = database.createObjectStore(QUEUE_STORE, { keyPath: 'id' })
        queueStore.createIndex('timestamp', 'timestamp', { unique: false })
        queueStore.createIndex('type',      'type',      { unique: false })
      }

      // Offline data store — cached content for reading offline
      if (!database.objectStoreNames.contains(DATA_STORE)) {
        const dataStore = database.createObjectStore(DATA_STORE, { keyPath: 'key' })
        dataStore.createIndex('type',      'type',      { unique: false })
        dataStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }

    request.onsuccess  = (e) => { db = (e.target as IDBOpenDBRequest).result; resolve(db) }
    request.onerror    = ()  => reject(new Error('Failed to open sync database'))
  })
}

// ─── Queue management ─────────────────────────────────────────────────────────

export async function enqueueAction(
  type:      SyncAction['type'],
  operation: SyncAction['operation'],
  payload:   Record<string, unknown>,
): Promise<void> {
  const database = await initSyncDB()
  const action: SyncAction = {
    id:         `${type}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type, operation, payload,
    timestamp:  Date.now(),
    retries:    0,
    maxRetries: 5,
  }

  return new Promise((resolve, reject) => {
    const tx    = database.transaction(QUEUE_STORE, 'readwrite')
    const store = tx.objectStore(QUEUE_STORE)

    // Check for duplicate (same type + payload key)
    const payloadKey = payload.verse_id ?? payload.id ?? payload.entry_id
    if (payloadKey) {
      const index   = store.index('type')
      const request = index.getAll(type)
      request.onsuccess = () => {
        const existing = (request.result as SyncAction[]).find(a =>
          (a.payload.verse_id ?? a.payload.id ?? a.payload.entry_id) === payloadKey &&
          a.operation === operation
        )
        if (existing) {
          // Update existing action instead of adding duplicate
          store.put({ ...existing, payload, timestamp: Date.now() })
        } else {
          store.add(action)
        }
        resolve()
      }
      request.onerror = () => reject()
    } else {
      store.add(action)
      tx.oncomplete = () => resolve()
      tx.onerror    = () => reject()
    }
  })
}

export async function getQueue(): Promise<SyncAction[]> {
  const database = await initSyncDB()
  return new Promise((resolve, reject) => {
    const tx      = database.transaction(QUEUE_STORE, 'readonly')
    const store   = tx.objectStore(QUEUE_STORE)
    const index   = store.index('timestamp')
    const request = index.getAll()
    request.onsuccess = () => resolve(request.result as SyncAction[])
    request.onerror   = () => reject()
  })
}

export async function removeFromQueue(id: string): Promise<void> {
  const database = await initSyncDB()
  return new Promise((resolve, reject) => {
    const tx    = database.transaction(QUEUE_STORE, 'readwrite')
    const store = tx.objectStore(QUEUE_STORE)
    store.delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject()
  })
}

// ─── Sync processor ───────────────────────────────────────────────────────────

const ENDPOINT_MAP: Record<SyncAction['type'], string> = {
  highlight:        '/api/v1/study/highlights',
  bookmark:         '/api/v1/study/bookmarks',
  note:             '/api/v1/study/notes',
  prayer:           '/api/v1/journal',
  reading_progress: '/api/v1/reading-plans/progress',
}

async function processAction(action: SyncAction): Promise<boolean> {
  const endpoint = ENDPOINT_MAP[action.type]
  const method   = action.operation === 'create' ? 'POST'
                 : action.operation === 'update' ? 'PATCH'
                 : 'DELETE'

  const url = action.operation === 'delete' && action.payload.id
    ? `${endpoint}/${action.payload.id}`
    : endpoint

  try {
    const res = await fetch(url, {
      method,
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:        method !== 'DELETE' ? JSON.stringify(action.payload) : undefined,
    })
    return res.ok
  } catch {
    return false
  }
}

// Exponential backoff delay
function backoffDelay(retries: number): number {
  return Math.min(1000 * Math.pow(2, retries), 30000) // max 30 seconds
}

export async function processSyncQueue(): Promise<{ synced: number; failed: number }> {
  if (!navigator.onLine) return { synced: 0, failed: 0 }

  const queue = await getQueue()
  let synced  = 0
  let failed  = 0

  for (const action of queue) {
    const success = await processAction(action)

    if (success) {
      await removeFromQueue(action.id)
      synced++
    } else {
      failed++
      if (action.retries >= action.maxRetries) {
        // Give up after max retries — remove from queue to avoid infinite retry
        await removeFromQueue(action.id)
        console.error(`[BackgroundSync] Gave up on action ${action.id} after ${action.maxRetries} retries`)
      } else {
        // Update retry count and wait before next attempt
        const database = await initSyncDB()
        const tx = database.transaction(QUEUE_STORE, 'readwrite')
        tx.objectStore(QUEUE_STORE).put({ ...action, retries: action.retries + 1 })
        await new Promise(r => setTimeout(r, backoffDelay(action.retries)))
      }
    }
  }

  return { synced, failed }
}

// ─── Offline data cache (Bible chapters, devotionals) ──────────────────────────

export async function cacheOfflineData(
  key:     string,
  type:    'bible_chapter' | 'devotional' | 'daily',
  data:    unknown,
): Promise<void> {
  const database = await initSyncDB()
  return new Promise((resolve, reject) => {
    const tx    = database.transaction(DATA_STORE, 'readwrite')
    const store = tx.objectStore(DATA_STORE)
    store.put({ key, type, data, timestamp: Date.now() })
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject()
  })
}

export async function getOfflineData(key: string): Promise<unknown | null> {
  const database = await initSyncDB()
  return new Promise((resolve, reject) => {
    const tx    = database.transaction(DATA_STORE, 'readonly')
    const store = tx.objectStore(DATA_STORE)
    const req   = store.get(key)
    req.onsuccess = () => resolve(req.result?.data ?? null)
    req.onerror   = () => reject()
  })
}

// ─── Connection monitoring ────────────────────────────────────────────────────

let syncStatusCallbacks: Array<(status: SyncStatus) => void> = []

export function onSyncStatusChange(cb: (status: SyncStatus) => void) {
  syncStatusCallbacks.push(cb)
  return () => { syncStatusCallbacks = syncStatusCallbacks.filter(x => x !== cb) }
}

function emit(status: SyncStatus) {
  syncStatusCallbacks.forEach(cb => cb(status))
}

export function initConnectionMonitoring(): () => void {
  const handleOnline = async () => {
    emit('syncing')
    try {
      const result = await processSyncQueue()
      emit(result.failed > 0 ? 'error' : 'idle')
    } catch {
      emit('error')
    }
  }

  const handleOffline = () => emit('offline')

  window.addEventListener('online',  handleOnline)
  window.addEventListener('offline', handleOffline)

  // Initial status
  emit(navigator.onLine ? 'idle' : 'offline')

  return () => {
    window.removeEventListener('online',  handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

// ─── Queue size getter ────────────────────────────────────────────────────────

export async function getPendingCount(): Promise<number> {
  const queue = await getQueue()
  return queue.length
}