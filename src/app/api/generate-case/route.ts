import { NextRequest } from 'next/server'

export const maxDuration = 120

interface ModelCfg { provider: string; baseUrl: string; apiKey: string; model: string }

async function callChat(
  ai: ModelCfg,
  systemPrompt: string,
  userPrompt: string,
  forceJsonMode = false
): Promise<string> {
  // Anthropic API format
  if (ai.provider === 'Anthropic') {
    const res = await fetch(`${ai.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': ai.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ai.model,
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })
    const d = await res.json()
    if (d.error) throw new Error(d.error.message ?? JSON.stringify(d.error))
    return d.content?.[0]?.text ?? ''
  }

  // OpenAI-compatible (including Azure, Together, Groq, custom, etc.)
  // Only add response_format when explicitly needed (AI 1 narrative) AND provider supports it
  const supportsJsonMode = ai.provider !== 'Google' && forceJsonMode
  const body: any = {
    model: ai.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  }
  if (supportsJsonMode) {
    body.response_format = { type: 'json_object' }
  }

  const res = await fetch(`${ai.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ai.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const d = await res.json()
  if (d.error) throw new Error(d.error.message ?? JSON.stringify(d.error))
  return d.choices?.[0]?.message?.content ?? ''
}

async function callImageGen(ai: ModelCfg, prompt: string): Promise<string> {
  const res = await fetch(`${ai.baseUrl}/images/generations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ai.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: ai.model, prompt, n: 1, size: '1024x1024' }),
  })
  const d = await res.json()
  if (d.error) throw new Error(d.error.message ?? JSON.stringify(d.error))
  return d.data?.[0]?.url ?? d.data?.[0]?.b64_json ?? ''
}

function narrativeSystem() {
  return `Kamu adalah penulis cerita misteri detektif Indonesia. Tugasmu membuat kasus investigasi yang realistis, menarik, dan konsisten dalam Bahasa Indonesia. Selalu kembalikan HANYA JSON valid tanpa teks lain.`
}

function narrativePrompt(cfg: { difficulty: string; region: string; premis: string }) {
  return `Buat kasus misteri detektif Indonesia dalam format JSON dengan struktur persis berikut:

{
  "title": "judul kasus menarik",
  "victim": {
    "name": "nama korban",
    "age": 35,
    "occupation": "pekerjaan",
    "address": "alamat lengkap di ${cfg.region || 'Jakarta'}",
    "date_of_incident": "tanggal kejadian",
    "description": "deskripsi kejadian dan kondisi korban ditemukan",
    "portrait_url": null,
    "scene_photos": [],
    "police_report": "isi laporan polisi resmi 2-3 paragraf"
  },
  "suspects": [
    {
      "id": "S1",
      "name": "nama tersangka 1",
      "age": 30,
      "occupation": "pekerjaan",
      "photo_url": null,
      "interrogation": "dialog interogasi panjang dan detail (4-6 pertanyaan & jawaban)",
      "skck": "catatan riwayat kriminal",
      "alibi": "alibi tersangka",
      "other_docs": [
        {
          "title": "judul dokumen",
          "content": "isi dokumen",
          "required_ability": null
        }
      ]
    }
  ],
  "witnesses": [
    {
      "id": "W1",
      "name": "nama saksi",
      "relation": "hubungan dengan korban",
      "photo_url": null,
      "initial_statement": "kesaksian awal saksi (2-3 paragraf)"
    }
  ],
  "clues": [
    {
      "id": "C1",
      "title": "nama barang bukti",
      "description": "deskripsi detail bukti dan signifikansinya",
      "image_url": null,
      "required_ability": null,
      "type": "physical"
    }
  ],
  "maps": {
    "city_map_url": null,
    "scene_map_url": null,
    "scene_photos": [
      { "url": null, "caption": "caption foto TKP" }
    ],
    "location_markers": [
      { "label": "TKP Utama", "description": "deskripsi", "x": 0.5, "y": 0.4 }
    ]
  },
  "digital_findings": {
    "whatsapp_chats": [
      {
        "id": "DW1",
        "sender": "nama pengirim",
        "content": "isi pesan WhatsApp",
        "timestamp": "2024-01-15T10:30:00Z",
        "is_deleted": false
      }
    ],
    "emails": [
      {
        "id": "DE1",
        "from": "pengirim@email.com",
        "to": "penerima@email.com",
        "subject": "subjek email",
        "body": "isi email lengkap",
        "timestamp": "2024-01-14T08:00:00Z",
        "attachments": []
      }
    ],
    "call_logs": [
      {
        "id": "DC1",
        "contact": "nama kontak",
        "number": "08123456789",
        "type": "incoming",
        "duration": 120,
        "timestamp": "2024-01-15T09:00:00Z"
      }
    ]
  },
  "forensic_docs": [
    {
      "title": "Judul Dokumen Forensik",
      "content": "Isi dokumen forensik lengkap",
      "required_ability": "forensik"
    }
  ],
  "news_articles": [
    {
      "id": "N1",
      "publication": "Nama Media",
      "journalist": "Nama Jurnalis",
      "headline": "Judul Berita",
      "body": "Isi berita lengkap 2-3 paragraf",
      "published_at": "2024-01-16T07:00:00Z"
    }
  ],
  "culprit_id": "S1",
  "solution_narrative": "penjelasan lengkap bagaimana pelaku melakukan kejahatan, motif, dan cara mengungkapnya (3-4 paragraf)"
}

Parameter kasus:
- Tingkat kesulitan: ${cfg.difficulty} (${cfg.difficulty === 'easy' ? 'alur sederhana, 3 tersangka, bukti jelas' : cfg.difficulty === 'medium' ? '3-4 tersangka, beberapa red herring' : cfg.difficulty === 'hard' ? '4 tersangka, banyak red herring, alibi rumit' : '4 tersangka, plot twist, alibi sangat kuat'})
- Setting: ${cfg.region || 'Jakarta'}
- Premis: ${cfg.premis || 'Pembunuhan misterius dengan banyak tersangka'}

Wajib:
- 3-4 suspects (culprit_id HARUS salah satu dari id suspects)
- 2-3 witnesses
- 5-8 clues (campuran physical, digital, testimonial, document)
- Beberapa clues harus memiliki required_ability (forensik, hacker, profiler, interogator, kriminolog, ahli_lapangan, jurnalis, pengacara) agar hanya pemain dengan ability tersebut yang bisa melihatnya
- 3-5 WhatsApp chats antara korban dan tersangka/saksi
- 2-3 emails yang relevan dengan kasus
- 3-5 call logs
- 2-3 dokumen forensik (dengan required_ability sesuai kemampuan)
- 1-2 berita media tentang kasus
- Semua teks dalam Bahasa Indonesia
- Kembalikan HANYA JSON valid`
}

function qcSystem() {
  return `Kamu adalah ahli prompt engineering untuk image generation. Tugasmu membuat prompt gambar yang atmospheric dan sinematik untuk game detektif.`
}

function qcPrompt(title: string, region: string, victimDesc: string) {
  return `Buat image generation prompt dalam bahasa Inggris untuk thumbnail kasus detektif ini:

Judul: ${title}
Setting: ${region}
Kejadian: ${victimDesc}

Buat prompt sinematik yang:
- Menggambarkan atmosfer misteri/crime noir
- Dramatic lighting, dark moody atmosphere
- Gaya: photorealistic cinematic photography
- Tidak ada teks atau tulisan di gambar
- Cocok sebagai thumbnail game misteri
- Maksimal 80 kata

Kembalikan HANYA teks prompt, tanpa penjelasan lain.`
}

export async function POST(req: NextRequest) {
  const { models, cfg } = await req.json()
  const enc = new TextEncoder()

  const stream = new ReadableStream({
    async start(ctrl) {
      const emit = (data: object) =>
        ctrl.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`))

      try {
        // ── STEP 1: Narrative ──────────────────────────────────────────────
        emit({ type: 'log', level: 'info', message: '[AI 1] Membuat narasi kasus...' })
        const ai1: ModelCfg = models[0]
        // AI 1 needs JSON mode — pass forceJsonMode=true only for OpenAI-compatible providers
        const raw1 = await callChat(ai1, narrativeSystem(), narrativePrompt(cfg), true)

        let caseContent: any
        try {
          const match = raw1.match(/\{[\s\S]*\}/)
          caseContent = JSON.parse(match ? match[0] : raw1)
        } catch {
          emit({ type: 'error', message: `[AI 1] Gagal parse JSON: ${raw1.substring(0, 200)}` })
          ctrl.close(); return
        }
        emit({ type: 'log', level: 'success', message: `[AI 1] Narasi selesai — "${caseContent.title}"` })
        emit({ type: 'step1', caseContent })

        // ── STEP 2: QC Image Prompt ────────────────────────────────────────
        emit({ type: 'log', level: 'info', message: '[AI 2] Membuat prompt gambar...' })
        const ai2: ModelCfg = models[1]
        let imagePrompt = ''
        try {
          // AI 2 is QC prompt - plain text output, NO json mode
          imagePrompt = await callChat(
            ai2,
            qcSystem(),
            qcPrompt(caseContent.title, cfg.region || 'Jakarta', caseContent.victim?.description || ''),
            false
          )
          imagePrompt = imagePrompt.trim()
          emit({ type: 'log', level: 'success', message: `[AI 2] Prompt siap: "${imagePrompt.substring(0, 60)}..."` })
        } catch (e: any) {
          emit({ type: 'log', level: 'warning', message: `[AI 2] Gagal (${e.message}), skip gambar` })
        }
        emit({ type: 'step2', imagePrompt })

        // ── STEP 3: Generate Image ─────────────────────────────────────────
        let thumbnailUrl: string | null = null
        if (imagePrompt) {
          emit({ type: 'log', level: 'info', message: '[AI 3] Generate gambar thumbnail...' })
          const ai3: ModelCfg = models[2]
          try {
            thumbnailUrl = await callImageGen(ai3, imagePrompt)
            emit({ type: 'log', level: 'success', message: '[AI 3] Gambar berhasil dibuat!' })
          } catch (e: any) {
            emit({ type: 'log', level: 'warning', message: `[AI 3] Gagal (${e.message}), kasus tetap disimpan tanpa gambar` })
          }
        }
        emit({ type: 'step3', thumbnailUrl })

        // ── DONE ───────────────────────────────────────────────────────────
        emit({ type: 'complete', caseContent, thumbnailUrl })

      } catch (e: any) {
        emit({ type: 'error', message: e.message ?? 'Unknown error' })
      } finally {
        ctrl.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
