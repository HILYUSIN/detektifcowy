"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Play, Users, Hash, ArrowRight, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { RoomSize } from "@/types"

interface RoomModalProps {
  onClose: () => void
  userId: string
  initialCaseId?: string
}

export default function RoomModal({ onClose, userId, initialCaseId }: RoomModalProps) {
  const router = useRouter()
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose")
  const [size, setSize] = useState<RoomSize>(4)
  const [joinCode, setJoinCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    // Generate room code
    const code = Math.random().toString(36).substring(2, 6).toUpperCase()

    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert({ room_code: code, size, host_id: userId, status: "waiting", case_id: initialCaseId ?? null })
      .select()
      .single()

    if (roomError || !room) {
      setError("Gagal membuat room. Coba lagi.")
      setLoading(false)
      return
    }

    // Join as host
    await supabase.from("room_players").insert({
      room_id: room.id,
      user_id: userId,
      abilities: [],
    })

    router.push(`/room/${room.room_code}`)
  }

  async function handleJoin() {
    if (!joinCode.trim()) return
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { data: room } = await supabase
      .from("rooms")
      .select("*, room_players(id)")
      .eq("room_code", joinCode.toUpperCase())
      .eq("status", "waiting")
      .single()

    if (!room) {
      setError("Room tidak ditemukan atau sudah dimulai.")
      setLoading(false)
      return
    }

    if (room.room_players.length >= room.size) {
      setError("Room sudah penuh.")
      setLoading(false)
      return
    }

    await supabase.from("room_players").insert({
      room_id: room.id,
      user_id: userId,
      abilities: [],
    })

    router.push(`/room/${room.room_code}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-deep-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-panel-gray border border-border-gray rounded-xl shadow-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-gray">
          <div>
            <p className="font-mono text-mono-label text-signature-red uppercase tracking-widest">INVESTIGASI</p>
            <h2 className="font-chivo font-bold text-headline-md text-ui-text-off-white mt-0.5">Mulai Game</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-muted-gray hover:text-signature-red hover:bg-surface-container transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {mode === "choose" && (
            <div className="space-y-3">
              <button
                onClick={() => setMode("create")}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border border-border-gray",
                  "hover:border-signature-red/50 hover:bg-surface-container transition-all group"
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-signature-red/10 flex items-center justify-center group-hover:bg-signature-red/20 transition-colors">
                  <Play size={18} className="text-signature-red" />
                </div>
                <div className="text-left">
                  <p className="font-franklin font-bold text-[14px] text-ui-text-off-white">Buat Room Baru</p>
                  <p className="font-franklin text-[12px] text-muted-gray">Jadilah host dan undang teman</p>
                </div>
                <ArrowRight size={16} className="text-muted-gray ml-auto group-hover:text-signature-red transition-colors" />
              </button>

              <button
                onClick={() => setMode("join")}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border border-border-gray",
                  "hover:border-signature-red/50 hover:bg-surface-container transition-all group"
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center group-hover:bg-surface-container-high transition-colors">
                  <Hash size={18} className="text-muted-gray group-hover:text-signature-red transition-colors" />
                </div>
                <div className="text-left">
                  <p className="font-franklin font-bold text-[14px] text-ui-text-off-white">Gabung Room</p>
                  <p className="font-franklin text-[12px] text-muted-gray">Masukkan kode room dari teman</p>
                </div>
                <ArrowRight size={16} className="text-muted-gray ml-auto group-hover:text-signature-red transition-colors" />
              </button>
            </div>
          )}

          {mode === "create" && (
            <div className="space-y-5">
              <button onClick={() => setMode("choose")} className="font-mono text-mono-label text-muted-gray hover:text-signature-red transition-colors uppercase tracking-wider flex items-center gap-1">
                &larr; Kembali
              </button>

              <div>
                <p className="font-mono text-label-bold text-muted-gray uppercase tracking-wider mb-3">Jumlah Pemain</p>
                <div className="grid grid-cols-3 gap-3">
                  {([2, 3, 4] as RoomSize[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                        size === s
                          ? "border-signature-red bg-signature-red/10 text-signature-red"
                          : "border-border-gray text-muted-gray hover:border-signature-red/50"
                      )}
                    >
                      <Users size={20} />
                      <span className="font-chivo font-bold text-[18px]">{s}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wider">
                        {s === 2 ? "Duo" : s === 3 ? "Trio" : "Squad"}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="font-mono text-[11px] text-muted-gray mt-2">
                  {size === 2 ? "4 ability per pemain" : size === 3 ? "2-3 ability per pemain" : "2 ability per pemain"}
                </p>
              </div>

              {error && <p className="font-franklin text-[13px] text-signature-red">{error}</p>}

              <button
                onClick={handleCreate}
                disabled={loading}
                className={cn(
                  "w-full h-11 rounded-xl font-franklin font-bold text-[14px] text-white uppercase tracking-wider",
                  "bg-gradient-to-r from-signature-red to-deep-black",
                  "hover:-translate-y-0.5 hover:shadow-glow-red transition-all duration-300",
                  "disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                )}
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Play size={16} /> BUAT ROOM</>}
              </button>
            </div>
          )}

          {mode === "join" && (
            <div className="space-y-5">
              <button onClick={() => setMode("choose")} className="font-mono text-mono-label text-muted-gray hover:text-signature-red transition-colors uppercase tracking-wider flex items-center gap-1">
                &larr; Kembali
              </button>

              <div className="space-y-1.5">
                <label className="block font-mono text-label-bold text-muted-gray uppercase tracking-wider">Kode Room</label>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={4}
                  placeholder="Contoh: A4F2"
                  className={cn(
                    "w-full h-14 px-4 rounded-xl border-2 border-border-gray bg-surface-container",
                    "font-chivo font-black text-[24px] text-center text-ui-text-off-white placeholder:text-muted-gray/50 tracking-[0.5em]",
                    "outline-none focus:border-signature-red transition-colors"
                  )}
                />
              </div>

              {error && <p className="font-franklin text-[13px] text-signature-red">{error}</p>}

              <button
                onClick={handleJoin}
                disabled={loading || joinCode.length < 4}
                className={cn(
                  "w-full h-11 rounded-xl font-franklin font-bold text-[14px] text-white uppercase tracking-wider",
                  "bg-gradient-to-r from-signature-red to-deep-black",
                  "hover:-translate-y-0.5 hover:shadow-glow-red transition-all duration-300",
                  "disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                )}
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Hash size={16} /> GABUNG ROOM</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}