import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { witnessName, witnessRelation, initialStatement, question, conversationHistory, caseContext } = await req.json()

  // For now return a placeholder - real AI integration comes in Fase 6
  // This keeps the UI functional without breaking
  const response = `[AI tidak dikonfigurasi] ${witnessName} belum bisa menjawab pertanyaan ini. Hubungi admin untuk mengaktifkan AI.`

  return NextResponse.json({ response })
}