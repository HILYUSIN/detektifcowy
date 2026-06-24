import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ModelCfg { provider: string; baseUrl: string; apiKey: string; model: string }

async function callChat(ai: ModelCfg, systemPrompt: string, userPrompt: string): Promise<string> {
  if (ai.provider === 'Anthropic') {
    const res = await fetch(`${ai.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': ai.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: ai.model, max_tokens: 2048, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] }),
    })
    const d = await res.json()
    if (d.error) throw new Error(d.error.message ?? JSON.stringify(d.error))
    return d.content?.[0]?.text ?? ''
  }
  const res = await fetch(`${ai.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ai.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: ai.model,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      max_tokens: 2048,
    }),
  })
  const d = await res.json()
  if (d.error) throw new Error(d.error.message ?? JSON.stringify(d.error))
  return d.choices?.[0]?.message?.content ?? ''
}

export async function POST(req: NextRequest) {
  const { witnessName, witnessRelation, initialStatement, question, conversationHistory, caseContext } = await req.json()

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ response: `[AI tidak dikonfigurasi] ${witnessName} belum bisa menjawab pertanyaan ini.` })
    }

    const { data: configData } = await supabase
      .from('ai_generator_config')
      .select('config')
      .eq('user_id', user.id)
      .single()

    const config = configData?.config as ModelCfg[] | null
    const ai1 = config?.[0]

    if (!ai1 || !ai1.apiKey) {
      return NextResponse.json({ response: `[AI tidak dikonfigurasi] ${witnessName} belum bisa menjawab pertanyaan ini. Hubungi admin untuk mengaktifkan AI.` })
    }

    const systemPrompt = `Kamu adalah saksi bernama ${witnessName} dalam sebuah kasus kriminal.
Hubungan dengan korban: ${witnessRelation}
Pernyataan awal: ${initialStatement}

Konteks kasus: ${caseContext || 'Tidak tersedia'}

Aturan:
- Jawab HANYA sebagai ${witnessName}, jangan berpura-pura menjadi orang lain
- Konsisten dengan pernyataan awal yang sudah diberikan
- Jika pertanyaan tidak relevan dengan pengetahuanmu, katakan "Saya tidak tahu tentang itu"
- Jika pertanyaan mengarah ke hal yang tidak kamu ketahui, katakan "Saya tidak yakin"
- Gunakan bahasa Indonesia yang natural
- Jawaban harus singkat tapi informatif (2-4 kalimat)
- Jangan mengarang informasi yang tidak ada dalam konteks`

    const historyText = conversationHistory?.length
      ? conversationHistory.map((h: any) => `${h.role === 'user' ? 'Penyidik' : witnessName}: ${h.content}`).join('\n')
      : ''

    const userPrompt = historyText
      ? `Sebelumnya:\n${historyText}\n\nPenyidik bertanya: ${question}`
      : `Penyidik bertanya: ${question}`

    const response = await callChat(ai1, systemPrompt, userPrompt)
    return NextResponse.json({ response })
  } catch (e: any) {
    return NextResponse.json({ response: `[AI Error] ${witnessName} tidak dapat menjawab saat ini. Error: ${e.message}` })
  }
}
