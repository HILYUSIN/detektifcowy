import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RoomLobbyClient from './lobby-client'

export default async function RoomPage({ params }: { params: { code: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const { data: room } = await supabase
    .from('rooms')
    .select('*, cases(id, title, difficulty, description, thumbnail_url), room_players(*, profiles(username, rank))')
    .eq('room_code', params.code)
    .single()

  if (!room) redirect('/dashboard')

  if (room.status === 'in_progress') {
    redirect(`/room/${params.code}/case`)
  }
  if (room.status === 'finished') {
    redirect('/dashboard')
  }

  const currentPlayer = room.room_players?.find((p: any) => p.user_id === user.id)
  const isHost = room.host_id === user.id

  return (
    <RoomLobbyClient
      room={room}
      currentUserId={user.id}
      currentProfile={profile}
      isHost={isHost}
      initialPlayers={room.room_players ?? []}
    />
  )
}