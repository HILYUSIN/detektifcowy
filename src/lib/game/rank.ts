import { Rank, RANK_XP_THRESHOLDS } from "@/types"

const RANK_ORDER: Rank[] = [
  "cadet_investigator",
  "field_detective",
  "senior_detective",
  "detective_sergeant",
  "detective_lieutenant",
  "chief_inspector",
]

export function getRankFromXP(xp: number): Rank {
  let rank: Rank = "cadet_investigator"
  for (const r of RANK_ORDER) {
    if (xp >= RANK_XP_THRESHOLDS[r]) rank = r
  }
  return rank
}

export function getNextRank(rank: Rank): Rank | null {
  const idx = RANK_ORDER.indexOf(rank)
  if (idx === RANK_ORDER.length - 1) return null
  return RANK_ORDER[idx + 1]
}

export function getXPProgress(xp: number): {
  current: Rank
  next: Rank | null
  currentXP: number
  requiredXP: number
  progressPercent: number
} {
  const current = getRankFromXP(xp)
  const next = getNextRank(current)
  const currentThreshold = RANK_XP_THRESHOLDS[current]
  const nextThreshold = next ? RANK_XP_THRESHOLDS[next] : RANK_XP_THRESHOLDS[current]
  const range = nextThreshold - currentThreshold
  const earned = xp - currentThreshold
  const progressPercent = next ? Math.min(100, Math.floor((earned / range) * 100)) : 100

  return {
    current,
    next,
    currentXP: earned,
    requiredXP: range,
    progressPercent,
  }
}

export function canAccessDifficulty(
  rank: Rank,
  difficulty: "easy" | "medium" | "hard" | "leader"
): boolean {
  if (difficulty === "easy" || difficulty === "medium") return true
  const hardRanks: Rank[] = ["senior_detective", "detective_sergeant", "detective_lieutenant", "chief_inspector"]
  return hardRanks.includes(rank)
}

export function calculateScore({
  isWin,
  durationSeconds,
  maxDurationSeconds = 3600,
  puzzleCompleted,
  wrongAccusations,
}: {
  isWin: boolean
  durationSeconds: number
  maxDurationSeconds?: number
  puzzleCompleted: boolean
  wrongAccusations: number
}) {
  if (!isWin) {
    return {
      baseScore: 0,
      speedBonus: 0,
      puzzleBonus: 0,
      penalty: wrongAccusations * 200,
      total: 0,
      xpEarned: 50, // participation XP
    }
  }

  const baseScore = 1000
  const timeRatio = Math.max(0, 1 - durationSeconds / maxDurationSeconds)
  const speedBonus = Math.floor(timeRatio * 500)
  const puzzleBonus = puzzleCompleted ? 300 : 0
  const penalty = wrongAccusations * 200
  const total = Math.max(0, baseScore + speedBonus + puzzleBonus - penalty)
  const xpEarned = Math.floor(total / 2)

  return { baseScore, speedBonus, puzzleBonus, penalty, total, xpEarned }
}
