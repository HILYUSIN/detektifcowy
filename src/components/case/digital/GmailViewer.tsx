'use client'

import { useState } from 'react'
import { Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Email } from '@/types'

interface GmailViewerProps {
  emails: Email[]
}

function formatTimestamp(timestamp: string): string {
  try {
    const d = new Date(timestamp)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) {
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
  } catch {
    return timestamp
  }
}

export default function GmailViewer({ emails }: GmailViewerProps) {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(
    emails.length > 0 ? emails[0] : null,
  )

  return (
    <div className="flex h-full w-full overflow-hidden rounded-xl bg-[#111]">
      {/* Left Sidebar - hidden on mobile */}
      <aside className="hidden md:flex flex-col w-48 bg-[#1f1f1f] shrink-0 py-2">
        <div className="px-3 py-1.5 mb-1">
          <span className="font-franklin text-[13px] font-bold text-white">
            Gmail
          </span>
        </div>
        <nav className="flex flex-col gap-0.5">
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 text-left bg-[#323232] rounded-r-full font-franklin text-[13px] text-white"
          >
            Kotak Masuk
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 text-left font-franklin text-[13px] text-[#888] hover:bg-[#2a2a2a] rounded-r-full transition-colors"
          >
            Terkirim
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 text-left font-franklin text-[13px] text-[#888] hover:bg-[#2a2a2a] rounded-r-full transition-colors"
          >
            Draf
          </button>
        </nav>
      </aside>

      {/* Email list */}
      <div
        className={cn(
          'flex flex-col border-r border-[#333] overflow-y-auto bg-[#111]',
          selectedEmail ? 'hidden md:flex md:w-64 shrink-0' : 'flex flex-1',
        )}
        style={{ scrollbarWidth: 'none' }}
      >
        {emails.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-[#888] text-[13px]">
            Kotak masuk kosong
          </div>
        ) : (
          emails.map((email) => (
            <button
              key={email.id}
              type="button"
              onClick={() => setSelectedEmail(email)}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 text-left border-b border-[#222] hover:bg-[#1a1a1a] transition-colors w-full',
                selectedEmail?.id === email.id && 'bg-[#1a1a1a]',
              )}
            >
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-franklin font-bold text-[13px] text-white w-36 truncate shrink-0">
                    {email.from}
                  </span>
                  <span className="text-[11px] text-[#888] shrink-0">
                    {formatTimestamp(email.timestamp)}
                  </span>
                </div>
                <span className="font-franklin text-[13px] text-[#ccc] truncate mt-0.5">
                  {email.subject}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Reading pane */}
      {selectedEmail ? (
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-[#111]">
          {/* Back button mobile */}
          <button
            type="button"
            onClick={() => setSelectedEmail(null)}
            className="md:hidden flex items-center gap-1 px-3 py-2 text-[#888] text-[13px] border-b border-[#222] hover:text-white"
          >
            &larr; Kembali
          </button>

          <div
            className="flex-1 overflow-y-auto px-5 py-4"
            style={{ scrollbarWidth: 'none' }}
          >
            {/* Subject */}
            <h2 className="font-chivo font-bold text-[18px] text-white leading-snug mb-3">
              {selectedEmail.subject}
            </h2>

            {/* From / To */}
            <div className="flex flex-col gap-0.5 mb-3 border-b border-[#222] pb-3">
              <span className="font-mono text-[12px] text-[#888]">
                <span className="text-[#555]">Dari: </span>
                {selectedEmail.from}
              </span>
              <span className="font-mono text-[12px] text-[#888]">
                <span className="text-[#555]">Kepada: </span>
                {selectedEmail.to}
              </span>
              <span className="font-mono text-[12px] text-[#888]">
                <span className="text-[#555]">Waktu: </span>
                {formatTimestamp(selectedEmail.timestamp)}
              </span>
            </div>

            {/* Attachments */}
            {selectedEmail.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedEmail.attachments.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1a1a1a] border border-[#333] rounded-lg text-[12px] text-[#ccc] font-mono"
                  >
                    <Paperclip size={11} className="shrink-0 text-[#888]" />
                    <span>{att}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Body */}
            <p className="font-serif text-[15px] text-[#e0e0e0] leading-relaxed whitespace-pre-line">
              {selectedEmail.body}
            </p>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-[#888] text-[13px]">
          Pilih email untuk membaca
        </div>
      )}
    </div>
  )
}