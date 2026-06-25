import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CaseClient from './case-client'

export default async function CasePage({ params }: { params: { code: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get room with case data and players (including profile info)
  const { data: room } = await supabase
    .from('rooms')
    .select('*, cases(*), room_players(*, profiles(username, rank))')
    .eq('room_code', params.code)
    .single()

  if (!room || !room.cases) redirect('/dashboard')

  // Only allow in-progress rooms
  if (room.status === 'waiting') redirect(`/room/${params.code}`)
  if (room.status === 'finished') redirect('/dashboard')

  // Get current player
  const currentPlayer = room.room_players.find((p: any) => p.user_id === user.id)
  if (!currentPlayer) redirect('/dashboard')

  const caseContent = room.cases.content_json

  return (
    <CaseClient
      room={room}
      caseData={room.cases}
      caseContent={caseContent}
      currentPlayer={currentPlayer}
      currentUserId={user.id}
    />
  )
}