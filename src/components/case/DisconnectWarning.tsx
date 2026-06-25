"use client"

import { useState, useEffect } from "react"

interface DisconnectWarningProps {
  disconnectedUsername: string | null
  disconnectedAt: Date | null
  timeoutMs?: number
}

export default function DisconnectWarning({
  disconnectedUsername,
  disconnectedAt,
  timeoutMs = 300000,
}: DisconnectWarningProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(timeoutMs)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!disconnectedAt) { setIsExpired(false); return }
    const interval = setInterval(() => {
      const elapsed = new Date().getTime() - disconnectedAt.getTime()
      const remaining = Math.max(0, timeoutMs - elapsed)
      setTimeRemaining(remaining)
      if (remaining === 0) { setIsExpired(true); clearInterval(interval) }
    }, 1000)
    return () => clearInterval(interval)
  }, [disconnectedAt, timeoutMs])

  if (!disconnectedUsername) return null

  const minutes = Math.floor(timeRemaining / 60000)
  const seconds = Math.floor((timeRemaining % 60000) / 1000)
  const timeStr = minutes + ":" + String(seconds).padStart(2, "0")

  return (
    <div
      className="fixed top-16 left-0 right-0 z-45 flex items-center justify-center px-4 py-2.5 backdrop-blur-sm"
      style={{ backgroundColor: isExpired ? "rgba(214,48,49,0.9)" : "rgba(113,63,18,0.9)", borderBottom: "1px solid " + (isExpired ? "#d63031" : "#92400e") }}
      role="alert"
      aria-live="polite"
    >
      <span className="font-mono text-[12px] text-white">
        {isExpired
          ? "Tim Anda dinyatakan kalah — " + disconnectedUsername + " meninggalkan game"
          : "! " + disconnectedUsername + " terputus — " + timeStr + " tersisa"}
      </span>
    </div>
  )
}