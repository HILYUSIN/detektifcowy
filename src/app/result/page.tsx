'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CulpritReveal from '@/components/result/CulpritReveal'
import WinScreen from '@/components/result/WinScreen'
import LoseScreen from '@/components/result/LoseScreen'

type Phase = 'reveal' | 'result'

export default function ResultPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('reveal')
  const [gameResult, setGameResult] = useState<any>(null)

  useEffect(() => {
    const stored = localStorage.getItem('gameResult')
    if (!stored) {
      router.push('/dashboard')
      return
    }
    try {
      setGameResult(JSON.parse(stored))
    } catch {
      router.push('/dashboard')
    }
  }, [])

  if (!gameResult) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0d0d0d' }}>
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#d63031', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (phase === 'reveal') {
    return (
      <CulpritReveal
        culpritName={gameResult.culpritName ?? 'Tidak Diketahui'}
        culpritOccupation={gameResult.culpritOccupation ?? ''}
        culpritPhotoUrl={gameResult.culpritPhotoUrl ?? null}
        solutionNarrative={gameResult.solutionNarrative ?? ''}
        onRevealComplete={() => setPhase('result')}
      />
    )
  }

  if (gameResult.isWin) {
    return (
      <WinScreen
        caseTitle={gameResult.caseTitle ?? ''}
        baseScore={gameResult.baseScore ?? 0}
        speedBonus={gameResult.speedBonus ?? 0}
        puzzleBonus={gameResult.puzzleBonus ?? 0}
        penalty={gameResult.penalty ?? 0}
        totalScore={gameResult.totalScore ?? 0}
        xpEarned={gameResult.xpEarned ?? 0}
        durationSeconds={gameResult.durationSeconds ?? 0}
        players={gameResult.players ?? []}
        currentUserId={gameResult.currentUserId ?? ''}
        earnedBadges={gameResult.earnedBadges ?? []}
        onPlayAgain={() => router.push('/dashboard')}
        onDashboard={() => router.push('/dashboard')}
      />
    )
  }

  return (
    <LoseScreen
      loseReason={gameResult.loseReason ?? 'wrong_accusation'}
      accusedName={gameResult.accusedName}
      culpritName={gameResult.culpritName}
      disconnectedUsername={gameResult.disconnectedUsername}
      penalty={gameResult.penalty ?? 0}
      xpEarned={gameResult.xpEarned ?? 50}
      players={gameResult.players ?? []}
      currentUserId={gameResult.currentUserId ?? ''}
      onTryAgain={() => router.push('/dashboard')}
      onDashboard={() => router.push('/dashboard')}
    />
  )
}