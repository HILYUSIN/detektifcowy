"use client"

import { useState } from "react"
import { Search, TrendingUp } from "lucide-react"
import DashboardNavbar from "@/components/dashboard/Navbar"
import CaseCarousel from "@/components/dashboard/CaseCarousel"
import Leaderboard from "@/components/dashboard/Leaderboard"
import RoomModal from "@/components/dashboard/RoomModal"
import { type UserProfile, type Case, type Rank } from "@/types"
import { cn } from "@/lib/utils"

interface LeaderboardEntry {
  id: string
  username: string
  rank: Rank
  total_xp: number
}

interface DashboardClientProps {
  profile: UserProfile
  cases: Case[]
  leaderboard: LeaderboardEntry[]
  currentUserId: string
}

export default function DashboardClient({
  profile,
  cases,
  leaderboard,
  currentUserId,
}: DashboardClientProps) {
  const [showRoomModal, setShowRoomModal] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar profile={profile} />

      {/* Main Content */}
      <main className="pt-16">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-signature-red/5 blur-[100px] rounded-full" />
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />
          </div>

          <div className="max-w-container mx-auto px-margin-edge py-20 text-center relative">
            <p className="font-mono text-mono-label text-signature-red uppercase tracking-[0.3em] mb-4">
              UNIT INVESTIGASI KHUSUS
            </p>
            <h1
              className="font-chivo font-black text-headline-xl text-ui-text-off-white uppercase mb-4 drop-shadow-lg"
              style={{ textShadow: "0 0 10px rgba(214,48,49,0.3)" }}
            >
              SIAP UNTUK
              <br />
              INVESTIGASI BERIKUTNYA?
            </h1>
            <p className="font-franklin text-body-lg text-muted-gray max-w-xl mx-auto mb-10">
              Ungkap pelaku, selesaikan kasus, dan naikkan peringkatmu sebagai detektif terbaik.
            </p>

            <button
              onClick={() => setShowRoomModal(true)}
              className={cn(
                "inline-flex items-center gap-3 px-10 py-4 rounded-xl",
                "font-franklin font-bold text-[16px] text-white uppercase tracking-wider",
                "bg-gradient-to-r from-signature-red to-deep-black",
                "transition-all duration-300",
                "hover:-translate-y-1 hover:shadow-glow-red-lg",
                "active:translate-y-0"
              )}
            >
              <Search size={20} />
              MULAI INVESTIGASI
            </button>
          </div>
        </section>

        {/* TOP CASES CAROUSEL */}
        <section className="max-w-container mx-auto px-margin-edge py-12">
          <div className="flex items-center justify-between mb-6">
            <div className="accent-bar-left">
              <h2 className="font-chivo font-bold text-headline-md text-ui-text-off-white uppercase">
                KASUS TERPOPULER
              </h2>
              <p className="font-franklin text-[13px] text-muted-gray mt-0.5">
                Kasus yang paling banyak dimainkan
              </p>
            </div>
          </div>
          <CaseCarousel cases={cases} />
        </section>

        {/* LEADERBOARD */}
        <section className="max-w-container mx-auto px-margin-edge py-12 border-t border-border-gray/50">
          <div className="flex items-center justify-between mb-6">
            <div className="accent-bar-left">
              <h2 className="font-chivo font-bold text-headline-md text-ui-text-off-white uppercase">
                PAPAN PERINGKAT
              </h2>
              <p className="font-franklin text-[13px] text-muted-gray mt-0.5">
                Detektif terbaik bulan ini
              </p>
            </div>
            <div className="flex items-center gap-2 text-muted-gray">
              <TrendingUp size={16} />
              <span className="font-mono text-mono-label uppercase tracking-wider">Top 10</span>
            </div>
          </div>
          <Leaderboard entries={leaderboard} currentUserId={currentUserId} />
        </section>

        {/* Footer padding */}
        <div className="h-16" />
      </main>

      {/* Room Modal */}
      {showRoomModal && (
        <RoomModal
          onClose={() => setShowRoomModal(false)}
          userId={currentUserId}
        />
      )}
    </div>
  )
}