'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, X, BookmarkPlus } from 'lucide-react'
import type { Witness, AbilityId } from '@/types'

interface ChatMessage {
  role: 'user' | 'witness'
  content: string
  timestamp: Date
}

interface SaksiTabProps {
  witnesses: Witness[]
  caseId: string
  playerAbilities: AbilityId[]
  onAddToNotebook: (item: { title: string; content: string; type: string }) => void
}

function InitialAvatar({ name }: { name: string }) {
  return (
    <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
      <span className="font-chivo font-black text-2xl text-muted-gray/60">
        {name?.[0]?.toUpperCase() ?? '?'}
      </span>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-surface-container rounded-2xl rounded-tl-none w-fit">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-muted-gray animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

function WitnessChat({
  witness,
  caseId,
  onClose,
  onAddToNotebook,
}: {
  witness: Witness
  caseId: string
  onClose: () => void
  onAddToNotebook: (item: { title: string; content: string; type: string }) => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'witness',
      content: witness.initial_statement ?? `Halo, saya ${witness.name}. Apa yang ingin Anda tanyakan?`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async () => {
    const question = input.trim()
    if (!question || isTyping) return
    setInput("")

    const userMsg: ChatMessage = { role: 'user', content: question, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setIsTyping(true)

    try {
      const res = await fetch('/api/witness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          witnessName: witness.name,
          witnessRelation: witness.relation,
          initialStatement: witness.initial_statement,
          question,
          conversationHistory: messages.map((m) => ({ role: m.role, content: m.content })),
          caseContext: caseId,
        }),
      })
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { role: 'witness', content: data.response, timestamp: new Date() },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'witness', content: 'Maaf, terjadi kesalahan. Coba lagi.', timestamp: new Date() },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      className="fixed inset-0 z-[100] bg-deep-black/80 flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Chat dengan ${witness.name}`}
    >
      <div className="bg-[#1a1a1a] w-full sm:max-w-md sm:rounded-xl flex flex-col" style={{ height: '90vh', maxHeight: 680 }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-gray bg-surface-container sm:rounded-t-xl">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            {witness.photo_url ? (
              <img src={witness.photo_url} alt={witness.name} className="w-full h-full object-cover" />
            ) : (
              <InitialAvatar name={witness.name} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-chivo font-bold text-sm text-ui-text-off-white truncate">{witness.name}</p>
            <p className="font-mono text-[11px] text-muted-gray truncate">{witness.relation}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-gray hover:text-on-surface transition-colors"
            aria-label="Tutup chat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={[
                  'max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-signature-red text-white rounded-tr-none font-franklin'
                    : 'bg-surface-container text-on-surface rounded-tl-none font-serif',
                ].join(' ')}
              >
                {msg.content}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-[10px] text-muted-gray">{formatTime(msg.timestamp)}</span>
                {msg.role === 'witness' && (
                  <button
                    onClick={() =>
                      onAddToNotebook({
                        title: `Kesaksian ${witness.name}`,
                        content: msg.content,
                        type: 'quote',
                      })
                    }
                    className="text-muted-gray hover:text-signature-red transition-colors"
                    aria-label="Simpan ke notebook"
                    title="Simpan ke Notebook"
                  >
                    <BookmarkPlus size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-start">
              <TypingIndicator />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border-gray">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tulis pertanyaan..."
            className="flex-1 bg-surface-container border border-border-gray rounded-full px-4 py-2 text-sm text-on-surface font-franklin placeholder:text-muted-gray/60 focus:outline-none focus:border-signature-red transition-colors"
            aria-label="Tulis pertanyaan untuk saksi"
            disabled={isTyping}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="w-9 h-9 rounded-full bg-signature-red flex items-center justify-center text-white hover:opacity-80 transition-opacity disabled:opacity-40"
            aria-label="Kirim pertanyaan"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function WitnessCard({
  witness,
  onChat,
}: {
  witness: Witness
  onChat: () => void
}) {
  return (
    <div className="bg-panel-gray border border-border-gray rounded-xl overflow-hidden">
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-surface-container">
        {witness.photo_url ? (
          <img
            src={witness.photo_url}
            alt={`Foto ${witness.name}`}
            className="w-full h-full object-cover grayscale"
          />
        ) : (
          <InitialAvatar name={witness.name} />
        )}
      </div>
      <div className="p-4">
        <h4 className="font-chivo font-bold text-sm text-ui-text-off-white leading-tight">{witness.name}</h4>
        <p className="font-mono text-[11px] text-muted-gray mb-3">{witness.relation}</p>
        <button
          onClick={onChat}
          className="w-full py-1.5 font-mono text-xs uppercase tracking-wider border border-border-gray text-muted-gray hover:border-signature-red hover:text-on-surface transition-colors rounded"
          aria-label={`Tanya saksi ${witness.name}`}
        >
          Tanya Saksi
        </button>
      </div>
    </div>
  )
}

export default function SaksiTab({ witnesses, caseId, playerAbilities, onAddToNotebook }: SaksiTabProps) {
  const [chatWitness, setChatWitness] = useState<Witness | null>(null)

  if (!witnesses || witnesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-mono text-xs text-muted-gray uppercase tracking-wider">Belum ada saksi</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {witnesses.map((witness) => (
          <WitnessCard
            key={witness.id}
            witness={witness}
            onChat={() => setChatWitness(witness)}
          />
        ))}
      </div>

      {chatWitness && (
        <WitnessChat
          witness={chatWitness}
          caseId={caseId}
          onClose={() => setChatWitness(null)}
          onAddToNotebook={onAddToNotebook}
        />
      )}
    </>
  )
}