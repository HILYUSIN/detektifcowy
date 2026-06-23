import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { suspectId, culpritId, reason } = await req.json()

  const isCorrect = suspectId === culpritId

  return NextResponse.json({
    isCorrect,
    message: isCorrect
      ? 'Tuduhan Anda benar! Pelaku telah tertangkap.'
      : 'Tuduhan Anda salah. Pelaku masih bebas.',
  })
}