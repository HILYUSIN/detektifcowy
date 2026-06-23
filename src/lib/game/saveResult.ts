export interface GameResultData {
  isWin: boolean
  loseReason?: 'wrong_accusation' | 'timeout' | 'disconnect'
  caseTitle: string
  culpritName: string
  culpritOccupation: string
  culpritPhotoUrl: string | null
  solutionNarrative: string
  accusedName?: string
  disconnectedUsername?: string
  baseScore: number
  speedBonus: number
  puzzleBonus: number
  penalty: number
  totalScore: number
  xpEarned: number
  durationSeconds: number
  players: { userId: string; username: string; rank: string }[]
  currentUserId: string
  earnedBadges: { name: string; description: string; icon: string }[]
}

export function saveGameResult(data: GameResultData) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gameResult', JSON.stringify(data))
  }
}

export function clearGameResult() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gameResult')
  }
}