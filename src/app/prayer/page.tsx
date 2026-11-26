'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export default function PrayerPage(){
  const [rooms, setRooms] = useState<any[]>([])

  useEffect(()=>{
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if(!url || !key) return
    const supabase = createClient(url, key)
    supabase.from('prayer_rooms').select('*').order('created_at',{ascending:false}).then(({data})=> data && setRooms(data))
  },[])

  const create = async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(url, key)
    const { data } = await supabase.from('prayer_rooms').insert({ title: `Live Altar ${new Date().toLocaleDateString()}` }).select().single()
    if(data) setRooms([data, ...rooms])
  }

  return (
    <div style={{ padding:40, color:'white', background:'#0a0a0f', minHeight:'100vh' }}>
      <a href="/" style={{ color:'#888', textDecoration:'none' }}>← Back to Home</a>
      <h1 style={{ fontSize:36, fontWeight:900, marginTop:20 }}>Live Prayer Altars</h1>
      <button onClick={create} style={{ marginTop:20, background:'#6366f1', color:'white', border:0, padding:'14px 24px', borderRadius:10, fontWeight:800, cursor:'pointer' }}>+ Create Live Prayer Altar</button>
      <div style={{ marginTop:28, display:'grid', gap:14 }}>
        {rooms.map((r:any)=><div key={r.id} style={{ background:'#15151f', padding:18, borderRadius:10, border:'1px solid #222' }}><b>{r.title}</b><div style={{opacity:0.5, fontSize:12}}>{new Date(r.created_at).toLocaleString()}</div></div>)}
      </div>
    </div>
  )
}
