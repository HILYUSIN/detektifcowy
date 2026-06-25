import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { suspectId, culpritId, reason, roomId } = await req.json()

  const isCorrect = suspectId === culpritId

  // Persist to DB if roomId provided
  if (roomId) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('accusations').insert({
          room_id: roomId,
          user_id: user.id,
          suspect_id: suspectId,
          reason: reason ?? null,
          is_correct: isCorrect,
        })
      }
    } catch {}
  }

  return NextResponse.json({
    isCorrect,
    accusedSuspectId: suspectId,
    message: isCorrect
      ? 'Tuduhan Anda benar! Pelaku telah tertangkap.'
      : 'Tuduhan Anda salah. Pelaku masih bebas.',
  })
}