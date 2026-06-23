"use client"

import { PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react"
import type { CallLog } from "@/types"

interface CallLogViewerProps {
  callLogs: CallLog[]
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return ""
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0 && s > 0) return `${m}m ${s}d`
  if (m > 0) return `${m}m`
  return `${s}d`
}

function formatTimestamp(timestamp: string): string {
  try {
    const d = new Date(timestamp)
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
  } catch {
    return timestamp
  }
}

export default function CallLogViewer({ callLogs }: CallLogViewerProps) {
  return (
    <div className="flex flex-col rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#0d0d0d]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#111] border-b border-[#2a2a2a]">
        <PhoneIncoming size={16} className="text-green-400" />
        <span className="font-chivo font-bold text-[15px] text-ui-text-off-white">Log Panggilan</span>
      </div>

      {/* List */}
      <div className="flex flex-col overflow-y-auto max-h-[400px]" style={{ scrollbarWidth: "none" }}>
        {callLogs.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-gray text-[13px]">
            Tidak ada log panggilan
          </div>
        ) : (
          callLogs.map((log) => (
            <div key={log.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a2a] hover:bg-[#111] transition-colors">
              {/* Type icon */}
              <div className="flex-shrink-0">
                {log.type === "incoming" && <PhoneIncoming size={18} className="text-green-400" />}
                {log.type === "outgoing" && <PhoneOutgoing size={18} className="text-blue-400" />}
                {log.type === "missed" && <PhoneMissed size={18} className="text-signature-red" />}
              </div>

              {/* Contact info */}
              <div className="flex-1 min-w-0">
                <p className="font-franklin font-bold text-[14px] text-ui-text-off-white truncate">{log.contact}</p>
                <p className="font-mono text-[11px] text-muted-gray">{log.number}</p>
              </div>

              {/* Duration + timestamp */}
              <div className="text-right flex-shrink-0">
                {log.duration > 0 ? (
                  <p className="font-mono text-[12px] text-on-surface">{formatDuration(log.duration)}</p>
                ) : (
                  <p className="font-mono text-[12px] text-signature-red">Tidak dijawab</p>
                )}
                <p className="font-mono text-[11px] text-muted-gray mt-0.5">{formatTimestamp(log.timestamp)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-[#111] border-t border-[#2a2a2a] text-center">
        <p className="font-mono text-[10px] text-muted-gray uppercase tracking-wider">
          Data log dari perangkat korban - Hanya Baca
        </p>
      </div>
    </div>
  )
}