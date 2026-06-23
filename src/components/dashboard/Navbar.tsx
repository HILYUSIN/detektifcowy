"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { User, LogOut, ChevronDown, Shield, Clock, Settings } from "lucide-react"
import { logout } from "@/app/actions/auth"
import { cn } from "@/lib/utils"
import { RANK_LABELS, type UserProfile, type Rank } from "@/types"

const RANK_COLORS: Record<Rank, string> = {
  cadet_investigator:   "text-muted-gray",
  field_detective:      "text-blue-400",
  senior_detective:     "text-purple-400",
  detective_sergeant:   "text-orange-400",
  detective_lieutenant: "text-signature-red",
  chief_inspector:      "text-gold-win",
}

interface NavbarProps {
  profile: UserProfile
}

export default function DashboardNavbar({ profile }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function handleLogout() {
    await logout()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-deep-black/95 backdrop-blur-md border-b border-border-gray">
      <div className="max-w-container mx-auto h-full flex items-center justify-between px-margin-edge">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-chivo font-black text-headline-md text-signature-red uppercase tracking-tight">
            DETEKTIF
          </span>
          <span className="font-chivo font-black text-headline-md text-ui-text-off-white uppercase tracking-tight">
            COWY
          </span>
        </Link>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl border border-border-gray",
              "hover:border-signature-red/50 transition-all duration-200",
              open && "border-signature-red/50"
            )}
            aria-expanded={open}
            aria-haspopup="true"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
              <span className="font-chivo font-black text-[14px] text-ui-text-off-white uppercase">
                {profile.username.charAt(0)}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="font-franklin font-bold text-[13px] text-ui-text-off-white leading-none">{profile.username}</p>
              <p className={cn("font-mono text-[10px] uppercase tracking-wider leading-none mt-0.5", RANK_COLORS[profile.rank])}>
                {RANK_LABELS[profile.rank]}
              </p>
            </div>
            <ChevronDown size={14} className={cn("text-muted-gray transition-transform duration-200", open && "rotate-180")} />
          </button>

          {/* Dropdown Menu */}
          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-panel-gray border border-border-gray rounded-xl shadow-card overflow-hidden">
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-border-gray">
                <p className="font-franklin font-bold text-[13px] text-ui-text-off-white">{profile.username}</p>
                <p className={cn("font-mono text-[10px] uppercase tracking-wider mt-0.5", RANK_COLORS[profile.rank])}>
                  {RANK_LABELS[profile.rank]}
                </p>
                <div className="mt-2 h-1 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-signature-red to-deep-black rounded-full"
                    style={{ width: `${Math.min(100, (profile.total_xp % 1000) / 10)}%` }}
                  />
                </div>
                <p className="font-mono text-[10px] text-muted-gray mt-1">{profile.total_xp.toLocaleString()} XP</p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-on-surface hover:bg-surface-container hover:text-signature-red transition-colors"
                >
                  <User size={15} />
                  <span className="font-franklin text-[13px]">Edit Profil</span>
                </Link>
                <Link
                  href="/profile?tab=history"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-on-surface hover:bg-surface-container hover:text-signature-red transition-colors"
                >
                  <Clock size={15} />
                  <span className="font-franklin text-[13px]">Riwayat Permainan</span>
                </Link>
                <Link
                  href="/profile?tab=badges"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-on-surface hover:bg-surface-container hover:text-signature-red transition-colors"
                >
                  <Shield size={15} />
                  <span className="font-franklin text-[13px]">Badge Saya</span>
                </Link>
              </div>

              {/* Logout */}
              <div className="border-t border-border-gray py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-signature-red hover:bg-signature-red/10 transition-colors"
                >
                  <LogOut size={15} />
                  <span className="font-franklin font-bold text-[13px]">Keluar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}