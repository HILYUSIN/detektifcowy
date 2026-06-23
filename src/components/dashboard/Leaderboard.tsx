"use client"

import { Crown, Medal } from "lucide-react"
import { cn } from "@/lib/utils"
import { RANK_LABELS, type Rank } from "@/types"

interface LeaderboardEntry {
  id: string
  username: string
  rank: Rank
  total_xp: number
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId: string
}

const RANK_COLORS: Record<Rank, string> = {
  cadet_investigator:   "text-muted-gray",
  field_detective:      "text-blue-400",
  senior_detective:     "text-purple-400",
  detective_sergeant:   "text-orange-400",
  detective_lieutenant: "text-signature-red",
  chief_inspector:      "text-gold-win",
}

export default function Leaderboard({ entries, currentUserId }: LeaderboardProps) {
  return (
    <div className="bg-panel-gray border border-border-gray rounded-xl overflow-hidden" style={{ borderLeft: "2px solid #d63031" }}>
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-surface-container border-b border-border-gray">
        <div className="col-span-1">
          <span className="font-mono text-mono-label text-muted-gray uppercase tracking-wider">#</span>
        </div>
        <div className="col-span-7">
          <span className="font-mono text-mono-label text-muted-gray uppercase tracking-wider">Detektif</span>
        </div>
        <div className="col-span-4 text-right">
          <span className="font-mono text-mono-label text-muted-gray uppercase tracking-wider">XP</span>
        </div>
      </div>

      {/* Rows */}
      {entries.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="font-mono text-mono-label text-muted-gray uppercase tracking-wider">Belum ada data</p>
        </div>
      ) : (
        entries.map((entry, i) => {
          const isCurrentUser = entry.id === currentUserId
          const rank = i + 1
          return (
            <div
              key={entry.id}
              className={cn(
                "grid grid-cols-12 gap-2 px-5 py-3.5 border-b border-border-gray/50 transition-colors",
                isCurrentUser
                  ? "bg-signature-red/5 border-l-2 border-l-signature-red"
                  : "hover:bg-surface-container"
              )}
            >
              {/* Rank Number */}
              <div className="col-span-1 flex items-center">
                {rank === 1 ? (
                  <Crown size={16} className="text-gold-win" />
                ) : rank === 2 ? (
                  <Medal size={16} className="text-[#C0C0C0]" />
                ) : rank === 3 ? (
                  <Medal size={16} className="text-[#CD7F32]" />
                ) : (
                  <span className={cn(
                    "font-mono text-mono-label",
                    isCurrentUser ? "text-signature-red" : "text-muted-gray"
                  )}>#{rank}</span>
                )}
              </div>

              {/* Player Info */}
              <div className="col-span-7 flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-black font-chivo",
                  rank === 1 ? "bg-gold-win/20 border border-gold-win/50 text-gold-win" :
                  rank === 2 ? "bg-[#C0C0C0]/20 border border-[#C0C0C0]/50 text-[#C0C0C0]" :
                  rank === 3 ? "bg-[#CD7F32]/20 border border-[#CD7F32]/50 text-[#CD7F32]" :
                  "bg-surface-container-high border border-border-gray text-on-surface"
                )}>
                  {entry.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={cn(
                    "font-franklin font-bold text-[13px]",
                    isCurrentUser ? "text-signature-red" : "text-ui-text-off-white"
                  )}>
                    {entry.username}
                    {isCurrentUser && <span className="ml-2 font-mono text-[9px] text-signature-red/70 uppercase tracking-wider">ANDA</span>}
                  </p>
                  <p className={cn("font-mono text-[10px] uppercase tracking-wider", RANK_COLORS[entry.rank])}>
                    {RANK_LABELS[entry.rank]}
                  </p>
                </div>
              </div>

              {/* Score */}
              <div className="col-span-4 flex items-center justify-end">
                <span className={cn(
                  "font-mono text-mono-label font-bold",
                  isCurrentUser ? "text-signature-red" : "text-ui-text-off-white"
                )}>
                  {entry.total_xp.toLocaleString()}
                </span>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}