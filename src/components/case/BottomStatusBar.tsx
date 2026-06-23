'use client'

import { Hash, Users, Timer, Star } from 'lucide-react'
import { useEffect, useState } from 'react'

interface BottomStatusBarProps {
  roomCode: string
  connectedPlayers: number
  totalPlayers: number
  timerSeconds: number | null
  score: number
  difficulty: string
}

export default function BottomStatusBar({
  roomCode,
  connectedPlayers,
  totalPlayers,
  timerSeconds,
  score,
  difficulty,
}: BottomStatusBarProps) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(timerSeconds)

  useEffect(() => {
    setSecondsLeft(timerSeconds)
  }, [timerSeconds])

  useEffect(() => {
    if (secondsLeft === null) return
    if (secondsLeft <= 0) return
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [secondsLeft])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const playersDisconnected = connectedPlayers < totalPlayers
  const showTimer =
    secondsLeft !== null &&
    (difficulty === 'hard' || difficulty === 'leader')
  const timerCritical = secondsLeft !== null && secondsLeft < 60

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-deep-black/80 backdrop-blur-md border-t border-signature-red"
      role="status"
      aria-label="Game status"
    >
      <div className="flex items-center justify-around px-4 py-2">
        {/* Room code */}
        <div className="flex items-center gap-1.5">
          <Hash size={14} className="text-muted-gray" />
          <span className="font-mono text-xs text-muted-gray uppercase tracking-wider">Room</span>
          <span className="font-mono text-xs text-gold-win font-bold">{roomCode}</span>
        </div>

        {/* Players */}
        <div className="flex items-center gap-1.5">
          <Users
            size={14}
            className={playersDisconnected ? 'text-signature-red' : 'text-muted-gray'}
          />
          <span className="font-mono text-xs text-muted-gray uppercase tracking-wider">Pemain</span>
          <span
            className={`font-mono text-xs font-bold ${
              playersDisconnected ? 'text-signature-red' : 'text-gold-win'
            }`}
          >
            {connectedPlayers}/{totalPlayers}
          </span>
        </div>

        {/* Timer - only visible on hard/leader mode */}
        {showTimer && secondsLeft !== null && (
          <div className="flex items-center gap-1.5">
            <Timer
              size={14}
              className={timerCritical ? 'text-signature-red animate-pulse' : 'text-muted-gray'}
            />
            <span className="font-mono text-xs text-muted-gray uppercase tracking-wider">Waktu</span>
            <span
              className={`font-mono text-xs font-bold ${
                timerCritical ? 'text-signature-red' : 'text-gold-win'
              }`}
            >
              {formatTime(secondsLeft)}
            </span>
          </div>
        )}

        {/* Score */}
        <div className="flex items-center gap-1.5">
          <Star size={14} className="text-muted-gray" />
          <span className="font-mono text-xs text-muted-gray uppercase tracking-wider">Skor</span>
          <span className="font-mono text-xs text-gold-win font-bold">{score}</span>
        </div>
      </div>
    </div>
  )
}