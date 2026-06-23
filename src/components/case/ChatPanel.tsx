﻿﻿'use client'
import { cn } from '@/lib/utils'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ChatMessage {
  id: string
  userId: string
  username: string
  content: string
  timestamp: Date
}

interface Props {
  roomId: string
  userId: string
  username: string
  isOpen: boolean
  onClose: () => void
}

export default function ChatPanel({ roomId, userId, username, isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("chat:" + roomId)
      .on('broadcast', { event: 'chat-message' }, ({ payload }: { payload: any }) => {
        setMessages((prev) => [
          ...prev,
          {
            ...payload,
            timestamp: new Date(payload.timestamp),
          },
        ])
      })
      .subscribe()
    channelRef.current = channel as any

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const content = input.trim()
    if (!content || isSending || !channelRef.current) return
    setIsSending(true)
    const msg: ChatMessage = {
      id: Date.now().toString(),
      userId,
      username,
      content,
      timestamp: new Date(),
    }
    await (channelRef.current as any).send({
      type: 'broadcast',
      event: 'chat-message',
      payload: msg,
    })
    setInput('')
    setIsSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div
      className={cn("fixed top-0 right-0 h-full w-80 bg-panel-gray border-l border-border-gray z-40 flex flex-col transition-transform duration-300", isOpen ? "translate-x-0" : "translate-x-full")}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-gray flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-signature-red rounded-full" />
          <h2 className="font-mono text-xs uppercase tracking-widest text-ui-text-off-white">Chat Tim</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-muted-gray hover:text-ui-text-off-white"
          aria-label="Tutup chat"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 hide-scrollbar">
        {messages.length === 0 && (
          <p className="font-franklin text-[12px] text-muted-gray italic text-center mt-8">
            Belum ada pesan. Mulai diskusi tim!
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.userId === userId
          return (
            <div key={msg.id} className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
              {!isOwn && (
                <span className="font-mono text-[10px] text-muted-gray mb-0.5 px-1">
                  {msg.username}
                </span>
              )}
              <div
                className={cn("max-w-[85%] px-3 py-2 rounded-xl", isOwn ? "bg-signature-red/10 text-ui-text-off-white" : "bg-surface-container text-on-surface")}
              >
                <p className="font-franklin text-[13px] leading-relaxed break-words">{msg.content}</p>
              </div>
              <span className="font-mono text-[9px] text-muted-gray mt-0.5 px-1">
                {formatTime(msg.timestamp)}
              </span>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border-gray px-4 py-3">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan..."
            maxLength={500}
            className="flex-1 bg-surface-container border border-border-gray rounded-lg px-3 py-2 font-franklin text-[13px] text-ui-text-off-white placeholder:text-muted-gray focus:outline-none focus:border-signature-red/50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="p-2 rounded-lg bg-signature-red/80 hover:bg-signature-red disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            aria-label="Kirim pesan"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}