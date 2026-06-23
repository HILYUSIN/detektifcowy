'use client'

import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types'

interface TelegramViewerProps {
  messages: ChatMessage[]
  contactName: string
}

function formatTime(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return timestamp
  }
}

export default function TelegramViewer({
  messages,
  contactName,
}: TelegramViewerProps) {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden rounded-xl">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#1c2733] shrink-0">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-white font-bold text-[15px] leading-tight truncate">
            {contactName}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
            <span className="text-blue-400 text-[12px]">online</span>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div
        className="flex-1 overflow-y-auto bg-[#0e1621] px-3 py-3 flex flex-col gap-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {messages.map((msg) => {
          const isSent =
            msg.sender.toLowerCase() === 'korban' ||
            msg.sender.toLowerCase() === 'user'

          if (msg.is_deleted) {
            return (
              <div
                key={msg.id}
                className={cn(
                  'max-w-[75%] px-3 py-1.5 italic text-[#708fa0] text-[13px]',
                  isSent ? 'self-end text-right' : 'self-start',
                )}
              >
                [Pesan dihapus]
              </div>
            )
          }

          return (
            <div
              key={msg.id}
              className={cn(
                'flex flex-col max-w-[75%] px-3 py-1.5',
                isSent
                  ? 'self-end bg-[#2b5278] rounded-[12px_12px_4px_12px] text-white'
                  : 'self-start bg-[#182533] rounded-[12px_12px_12px_4px] text-[#f5f5f5]',
              )}
            >
              {!isSent && (
                <span className="text-blue-400 text-[11px] font-semibold leading-tight mb-0.5">
                  {msg.sender}
                </span>
              )}
              <span className="font-franklin text-[14px] leading-snug">
                {msg.content}
              </span>
              <span className="text-[11px] text-[#708fa0] text-right mt-0.5">
                {formatTime(msg.timestamp)}
              </span>
            </div>
          )
        })}
      </div>

      {/* Read-only label */}
      <div className="shrink-0 bg-[#0e1621] border-t border-[#1c2733] px-4 py-2 text-center">
        <span className="text-[11px] text-[#708fa0] italic">
          Arsip — Hanya Baca
        </span>
      </div>
    </div>
  )
}