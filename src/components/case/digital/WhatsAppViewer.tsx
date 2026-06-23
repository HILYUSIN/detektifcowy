"use client"

import { ArrowLeft, Ban } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/types"

interface WhatsAppViewerProps {
  messages: ChatMessage[]
  contactName: string
  contactAvatar: string | null
  onBack?: () => void
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

function formatTime(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  } catch {
    return timestamp
  }
}

export default function WhatsAppViewer({ messages, contactName, contactAvatar, onBack }: WhatsAppViewerProps) {
  return (
    <div className="flex flex-col h-[500px] rounded-xl overflow-hidden border border-[#2a3942]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#075E54]">
        {onBack && (
          <button onClick={onBack} className="text-white/80 hover:text-white transition-colors mr-1" aria-label="Kembali">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="w-9 h-9 rounded-full bg-[#128C7E] flex items-center justify-center flex-shrink-0">
          {contactAvatar ? (
            <img src={contactAvatar} alt={contactName} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="font-franklin font-bold text-[13px] text-white">{getInitials(contactName)}</span>
          )}
        </div>
        <div>
          <p className="font-franklin font-bold text-[14px] text-white">{contactName}</p>
          <p className="font-franklin text-[11px] text-green-300">Online</p>
        </div>
      </div>

      {/* Chat area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1.5 bg-[#0d1418]"
        style={{ scrollbarWidth: "none" }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#8696a0] text-[13px]">
            Tidak ada pesan
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.sender === "korban" ? "justify-end" : "justify-start"
              )}
            >
              {msg.is_deleted ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a3942] text-[#8696a0] italic text-[13px] max-w-[75%]">
                  <Ban size={13} />
                  <span>Pesan dihapus</span>
                </div>
              ) : (
                <div className={cn(
                  "max-w-[75%] px-3 py-2 rounded-lg",
                  msg.sender === "korban"
                    ? "bg-[#005c4b] text-white rounded-[8px_8px_0_8px]"
                    : "bg-[#1f2c34] text-white rounded-[8px_8px_8px_0]"
                )}>
                  {msg.sender !== "korban" && (
                    <p className="font-franklin font-bold text-[11px] text-green-400 mb-0.5">{msg.sender}</p>
                  )}
                  <p className="font-franklin text-[14px] leading-relaxed">{msg.content}</p>
                  <p className="font-mono text-[11px] text-[#8696a0] text-right mt-0.5">{formatTime(msg.timestamp)}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Read-only footer */}
      <div className="px-4 py-2 bg-[#1f2c34] border-t border-[#2a3942] text-center">
        <p className="font-mono text-[10px] text-[#8696a0] uppercase tracking-wider">Arsip Percakapan - Hanya Baca</p>
      </div>
    </div>
  )
}