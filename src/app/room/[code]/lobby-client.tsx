"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AbilityId, ABILITY_LABELS, ABILITY_DESCRIPTIONS } from "@/types"
import type { RoomSize } from "@/types"
import { cn } from "@/lib/utils"

const ALL_ABILITIES: AbilityId[] = [
  "forensik", "profiler", "hacker", "interogator",
  "kriminolog", "ahli_lapangan", "jurnalis", "pengacara",
]

function getRequiredCount(size: RoomSize, playerIndex: number): number {
  if (size === 2) return 4
  if (size === 4) return 2
  return playerIndex < 2 ? 3 : 2
}

interface Props {
  room: any
  currentUserId: string
  currentProfile: any
  isHost: boolean
  initialPlayers: any[]
}

export default function RoomLobbyClient({ room, currentUserId, isHost, initialPlayers }: Props) {
  const router = useRouter()
  const [players, setPlayers] = useState<any[]>(initialPlayers)
  const [myAbilities, setMyAbilities] = useState<AbilityId[]>([])
  const [isStarting, setIsStarting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const sortedPlayers = [...players].sort((a, b) =>
    new Date(a.joined_at ?? 0).getTime() - new Date(b.joined_at ?? 0).getTime()
  )
  const myIndex = sortedPlayers.findIndex((p) => p.user_id === currentUserId)
  const requiredCount = getRequiredCount(room.size as RoomSize, myIndex >= 0 ? myIndex : 0)

  useEffect(() => {
    const myPlayer = players.find((p) => p.user_id === currentUserId)
    if (myPlayer?.abilities?.length) setMyAbilities(myPlayer.abilities)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("room:" + room.room_code)
      .on("postgres_changes" as any, {
        event: "*", schema: "public", table: "room_players",
        filter: "room_id=eq." + room.id,
      }, () => {
        supabase.from("room_players").select("*, profiles(username, rank)")
          .eq("room_id", room.id).then(({ data }) => { if (data) setPlayers(data) })
      }).subscribe()

    const roomChannel = supabase
      .channel("room-status:" + room.id)
      .on("postgres_changes" as any, {
        event: "UPDATE", schema: "public", table: "rooms",
        filter: "id=eq." + room.id,
      }, (payload: any) => {
        if (payload.new?.status === "in_progress") {
          router.push("/room/" + room.room_code + "/case")
        }
      }).subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(roomChannel)
    }
  }, [room.id, room.room_code])

  const toggleAbility = useCallback((ability: AbilityId) => {
    setMyAbilities((prev) => {
      if (prev.includes(ability)) return prev.filter((a) => a !== ability)
      if (prev.length >= requiredCount) return prev
      return [...prev, ability]
    })
    setSaveSuccess(false)
  }, [requiredCount])

  const handleSave = async () => {
    if (myAbilities.length !== requiredCount) return
    setIsSaving(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.from("room_players")
      .update({ abilities: myAbilities })
      .eq("room_id", room.id)
      .eq("user_id", currentUserId)
    setIsSaving(false)
    if (err) { setError("Gagal menyimpan abilities.") }
    else {
      setSaveSuccess(true)
      setPlayers((prev) => prev.map((p) =>
        p.user_id === currentUserId ? { ...p, abilities: myAbilities } : p
      ))
    }
  }

  const handleStart = async () => {
    if (!isHost) return
    if (!room.case_id) { setError("Pilih case terlebih dahulu"); return }
    const allReady = sortedPlayers.every((p, idx) =>
      (p.abilities?.length ?? 0) === getRequiredCount(room.size as RoomSize, idx)
    )
    if (!allReady) { setError("Semua pemain harus memilih ability"); return }
    setIsStarting(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.from("rooms")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("id", room.id)
    if (err) { setError("Gagal memulai."); setIsStarting(false) }
    else router.push("/room/" + room.room_code + "/case")
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(room.room_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const readyCount = sortedPlayers.filter((p, idx) =>
    (p.abilities?.length ?? 0) === getRequiredCount(room.size as RoomSize, idx)
  ).length

  return (
    <div className="min-h-screen bg-background text-ui-text-off-white">
      {/* Header */}
      <div className="border-b border-border-gray bg-panel-gray px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard")}
          className="font-franklin text-sm text-muted-gray hover:text-ui-text-off-white transition-colors"
        >
          Kembali
        </button>
        <div className="text-center">
          <p className="font-mono text-[10px] text-muted-gray uppercase tracking-widest">Kode Room</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono font-bold text-2xl tracking-[0.2em] text-gold-win">
              #{room.room_code}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-surface-container border border-border-gray hover:border-signature-red transition-colors text-muted-gray hover:text-signature-red"
              title="Salin kode"
            >
              {copied ? (
                <span className="font-mono text-[10px] text-green-400">Disalin!</span>
              ) : (
                <span className="font-mono text-[10px]">Salin</span>
              )}
            </button>
          </div>
          <p className="font-franklin text-[11px] text-muted-gray mt-1">Bagikan ke teman</p>
        </div>
        <div className="font-mono text-[11px] text-muted-gray">
          {players.length}/{room.size} pemain
        </div>
      </div>

      {/* Main */}
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Player List */}
        <div className="bg-panel-gray border border-border-gray rounded-xl p-5">
          <div className="accent-bar-left mb-5">
            <h2 className="font-mono text-xs uppercase tracking-widest text-ui-text-off-white">
              Pemain ({players.length}/{room.size})
            </h2>
          </div>

          <div className="space-y-3">
            {sortedPlayers.map((player, idx) => {
              const isMe = player.user_id === currentUserId
              const isPlayerHost = player.user_id === room.host_id
              const username = player.profiles?.username ?? player.username ?? "Pemain"
              const abilities: AbilityId[] = player.abilities ?? []
              const req = getRequiredCount(room.size as RoomSize, idx)
              const isReady = abilities.length === req
              return (
                <div
                  key={player.id ?? player.user_id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border transition-colors",
                    isMe ? "border-signature-red/30 bg-signature-red/5" : "border-border-gray"
                  )}
                >
                  <div className="w-9 h-9 rounded-full bg-surface-container-high border border-border-gray flex items-center justify-center flex-shrink-0">
                    <span className="font-chivo font-bold text-sm text-ui-text-off-white">
                      {username[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-chivo font-bold text-sm text-ui-text-off-white truncate">{username}</span>
                      {isMe && <span className="font-mono text-[9px] uppercase tracking-wider text-signature-red border border-signature-red/30 rounded px-1">Kamu</span>}
                      {isPlayerHost && <span className="font-mono text-[9px] uppercase tracking-wider text-gold-win border border-gold-win/30 rounded px-1">Host</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {abilities.length > 0 ? abilities.map((ab) => (
                        <span key={ab} className="font-mono text-[9px] uppercase tracking-wide bg-signature-red/15 text-signature-red border border-signature-red/20 rounded px-1.5 py-0.5">
                          {ABILITY_LABELS[ab]}
                        </span>
                      )) : (
                        <span className="font-franklin text-[11px] text-muted-gray italic">Belum memilih ability</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 mt-1">
                    <div className={cn("w-3 h-3 rounded-full", isReady ? "bg-green-400" : "bg-muted-gray/40")} />
                  </div>
                </div>
              )
            })}

            {Array.from({ length: room.size - players.length }).map((_, i) => (
              <div
                key={"empty-" + i}
                className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border-gray bg-surface-container/30"
              >
                <div className="w-9 h-9 rounded-full bg-surface-container border border-dashed border-border-gray flex items-center justify-center">
                  <span className="text-muted-gray text-lg">+</span>
                </div>
                <span className="font-franklin text-sm text-muted-gray italic">Menunggu pemain...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col gap-5">
          {/* Ability Selection */}
          <div className="bg-panel-gray border border-border-gray rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="accent-bar-left">
                <h2 className="font-mono text-xs uppercase tracking-widest text-ui-text-off-white">Pilih Ability</h2>
              </div>
              <span className="font-mono text-[11px] text-muted-gray">
                <span className={cn(myAbilities.length === requiredCount ? "text-green-400" : "text-gold-win")}>
                  {myAbilities.length}
                </span>/{requiredCount}
              </span>
            </div>
            <p className="font-franklin text-[12px] text-muted-gray mb-4">
              Pilih {requiredCount} ability untuk karakter kamu di kasus ini.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ABILITIES.map((ability) => {
                const isSelected = myAbilities.includes(ability)
                const isAtMax = myAbilities.length >= requiredCount && !isSelected
                return (
                  <button
                    key={ability}
                    onClick={() => toggleAbility(ability)}
                    disabled={isAtMax}
                    className={cn(
                      "relative text-left p-3 rounded-xl border transition-all text-start",
                      isSelected
                        ? "border-signature-red bg-signature-red/10"
                        : "border-border-gray bg-surface-container hover:border-signature-red/50",
                      isAtMax && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-signature-red flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">v</span>
                      </span>
                    )}
                    <p className="font-chivo font-bold text-[13px] text-ui-text-off-white pr-5">
                      {ABILITY_LABELS[ability]}
                    </p>
                    <p className="font-franklin text-[11px] text-muted-gray mt-1 leading-tight">
                      {ABILITY_DESCRIPTIONS[ability]}
                    </p>
                  </button>
                )
              })}
            </div>
            <button
              onClick={handleSave}
              disabled={myAbilities.length !== requiredCount || isSaving}
              className={cn(
                "mt-4 w-full py-2.5 rounded-xl font-franklin font-bold text-sm uppercase tracking-wider transition-all",
                myAbilities.length === requiredCount && !isSaving
                  ? "bg-gradient-to-r from-signature-red to-deep-black text-white hover:-translate-y-0.5"
                  : "bg-surface-container-high text-muted-gray cursor-not-allowed"
              )}
            >
              {isSaving ? "Menyimpan..." : saveSuccess ? "Tersimpan!" : "Simpan Pilihan"}
            </button>
          </div>

          {/* Case Info */}
          <div className="bg-panel-gray border border-border-gray rounded-xl p-5">
            <div className="accent-bar-left mb-4">
              <h2 className="font-mono text-xs uppercase tracking-widest text-ui-text-off-white">Kasus</h2>
            </div>
            {room.cases ? (
              <div className="flex gap-4">
                {room.cases.thumbnail_url && (
                  <img src={room.cases.thumbnail_url} alt={room.cases.title}
                    className="w-16 h-16 rounded-lg object-cover border border-border-gray flex-shrink-0" />
                )}
                <div>
                  <h3 className="font-chivo font-bold text-ui-text-off-white">{room.cases.title}</h3>
                  <span className="mt-1 inline-block font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-muted-gray/40 text-muted-gray">
                    {room.cases.difficulty}
                  </span>
                  <p className="font-franklin text-[12px] text-muted-gray mt-1.5 leading-relaxed">
                    {room.cases.description}
                  </p>
                </div>
              </div>
            ) : (
              <p className="font-franklin text-sm text-muted-gray italic">Belum ada case dipilih</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-signature-red/10 border border-signature-red/30">
              <p className="font-franklin text-sm text-signature-red">{error}</p>
            </div>
          )}

          {/* Start Button - host only */}
          {isHost && (
            <div>
              <p className="font-mono text-[11px] text-muted-gray text-center mb-3">
                {readyCount}/{sortedPlayers.length} pemain siap
              </p>
              <button
                onClick={handleStart}
                disabled={readyCount < sortedPlayers.length || sortedPlayers.length < 2 || isStarting}
                className={cn(
                  "w-full py-3 rounded-xl font-franklin font-bold text-base uppercase tracking-widest transition-all",
                  readyCount >= sortedPlayers.length && sortedPlayers.length >= 2 && !isStarting
                    ? "bg-gradient-to-r from-signature-red to-deep-black text-white hover:-translate-y-1 hover:shadow-glow-red"
                    : "bg-surface-container-high text-muted-gray cursor-not-allowed"
                )}
              >
                {isStarting ? "Memulai..." : "Mulai Permainan"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}