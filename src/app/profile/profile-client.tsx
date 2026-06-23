"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { User, Shield, Edit3, Check, X, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { RANK_LABELS, RANK_XP_THRESHOLDS, type UserProfile, type Rank } from "@/types"
import { getXPProgress } from "@/lib/game/rank"
import Link from "next/link"

const RANK_COLORS: Record<Rank, string> = {
  cadet_investigator:   "text-muted-gray border-muted-gray",
  field_detective:      "text-blue-400 border-blue-400",
  senior_detective:     "text-purple-400 border-purple-400",
  detective_sergeant:   "text-orange-400 border-orange-400",
  detective_lieutenant: "text-signature-red border-signature-red",
  chief_inspector:      "text-gold-win border-gold-win",
}

export default function ProfileClient({ profile }: { profile: UserProfile }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState(profile.username)
  const [bio, setBio] = useState(profile.bio ?? "")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const xpProgress = getXPProgress(profile.total_xp)

  async function handleSave() {
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update({ username, bio })
        .eq("id", profile.id)
      if (error) {
        setError(error.message)
      } else {
        setIsEditing(false)
        router.refresh()
      }
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back button */}
      <div className="p-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 font-mono text-mono-label text-muted-gray hover:text-signature-red transition-colors uppercase tracking-wider">
          <ArrowLeft size={14} /> Dashboard
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-12">
        {/* Header Card */}
        <div className="bg-panel-gray border border-border-gray rounded-xl p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-surface-container-high border-2 border-border-gray flex items-center justify-center flex-shrink-0">
                <span className="font-chivo font-black text-[24px] text-ui-text-off-white uppercase">
                  {profile.username.charAt(0)}
                </span>
              </div>
              <div>
                {isEditing ? (
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={cn(
                      "font-chivo font-bold text-[20px] text-ui-text-off-white bg-surface-container",
                      "border-b-2 border-signature-red outline-none px-1 w-48"
                    )}
                  />
                ) : (
                  <h1 className="font-chivo font-bold text-[20px] text-ui-text-off-white">{profile.username}</h1>
                )}
                {/* Rank Badge */}
                <span className={cn(
                  "inline-block mt-1 font-mono text-mono-label uppercase tracking-wider border px-2 py-0.5 rounded",
                  RANK_COLORS[profile.rank]
                )}>
                  {RANK_LABELS[profile.rank]}
                </span>
              </div>
            </div>

            {/* Edit Toggle */}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-lg border border-border-gray text-muted-gray hover:text-signature-red hover:border-signature-red transition-all"
                aria-label="Edit profil"
              >
                <Edit3 size={16} />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave} disabled={isPending}
                  className="p-2 rounded-lg border border-green-500 text-green-500 hover:bg-green-500/10 transition-all disabled:opacity-50"
                  aria-label="Simpan"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => { setIsEditing(false); setUsername(profile.username); setBio(profile.bio ?? "") }}
                  className="p-2 rounded-lg border border-border-gray text-muted-gray hover:text-signature-red hover:border-signature-red transition-all"
                  aria-label="Batal"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="mb-6">
            <p className="font-mono text-label-bold text-muted-gray uppercase tracking-wider mb-2">Bio</p>
            {isEditing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Ceritakan sedikit tentang dirimu..."
                className={cn(
                  "w-full px-3 py-2 bg-surface-container border border-border-gray rounded-lg",
                  "font-franklin text-[14px] text-on-surface placeholder:text-muted-gray",
                  "outline-none focus:border-signature-red transition-colors resize-none"
                )}
              />
            ) : (
              <p className="font-franklin text-[14px] text-on-surface">
                {profile.bio || <span className="text-muted-gray italic">Belum ada bio</span>}
              </p>
            )}
          </div>

          {error && (
            <p className="font-franklin text-[13px] text-signature-red mb-4">{error}</p>
          )}

          {/* XP Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="font-mono text-label-bold text-muted-gray uppercase tracking-wider">XP Progress</p>
              <p className="font-mono text-mono-label text-ui-text-off-white">
                {profile.total_xp.toLocaleString()} XP
              </p>
            </div>
            <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-signature-red to-deep-black rounded-full transition-all duration-700"
                style={{ width: `${xpProgress.progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <p className="font-mono text-[11px] text-muted-gray">{RANK_LABELS[xpProgress.current]}</p>
              {xpProgress.next && (
                <p className="font-mono text-[11px] text-muted-gray">
                  {xpProgress.currentXP} / {xpProgress.requiredXP} XP ke {RANK_LABELS[xpProgress.next]}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total XP", value: profile.total_xp.toLocaleString(), icon: Shield },
            { label: "Rank", value: RANK_LABELS[profile.rank].split(" ")[0], icon: User },
            { label: "Status", value: "Aktif", icon: Check },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-panel-gray border border-border-gray rounded-xl p-4 text-center">
              <Icon size={20} className="text-signature-red mx-auto mb-2" />
              <p className="font-chivo font-bold text-[18px] text-ui-text-off-white">{value}</p>
              <p className="font-mono text-mono-label text-muted-gray uppercase tracking-wider mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
