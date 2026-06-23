import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminClient from './admin-client'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8" style={{ backgroundColor: '#0d0d0d' }}>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(214,48,49,0.1)', border: '1px solid rgba(214,48,49,0.3)' }}
        >
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#d63031' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="font-chivo font-black text-[28px] uppercase" style={{ color: '#f5f5f5' }}>
            AKSES DITOLAK
          </h1>
          <p className="font-franklin text-[14px] mt-2" style={{ color: '#888' }}>
            Akun Anda tidak memiliki izin admin.
          </p>
        </div>
        <a
          href="/dashboard"
          className="font-mono text-[11px] uppercase tracking-wider transition-opacity hover:opacity-80"
          style={{ color: '#d63031' }}
        >
          Kembali ke Dashboard
        </a>
      </div>
    )
  }

  const [{ count: totalCases }, { count: totalUsers }] = await Promise.all([
    supabase.from('cases').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ])

  return (
    <AdminClient
      profile={profile}
      totalCases={totalCases ?? 0}
      totalUsers={totalUsers ?? 0}
    />
  )
}