import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { suspectId, culpritId, reason } = await req.json()

  const isCorrect = suspectId === culpritId

  const message = isCorrect
    ? 'Tuduhan Anda benar! Pelaku telah tertangkap. Kasus selesai.'
    : 'Tuduhan Anda salah. Pelaku masih bebas. Coba lagi dengan bukti yang lebih kuat.'

  return NextResponse.json({
    isCorrect,
    message,
    penalty: isCorrect ? 0 : -200,
  })
}
