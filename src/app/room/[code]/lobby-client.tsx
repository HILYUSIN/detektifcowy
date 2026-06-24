"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AbilityId, ABILITY_LABELS, ABILITY_DESCRIPTIONS } from "@/types"
import type { RoomSize } from "@/types"
import { cn } from "@/lib/utils"
import { getActiveCases, assignCaseToRoom, removeCaseFromRoom, getChatMessages, sendChatMessage } from "./actions"

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

  // Case selector state
  const [showCaseSelector, setShowCaseSelector] = useState(false)
  const [activeCases, setActiveCases] = useState<any[]>([])
  const [casesLoading, setCasesLoading] = useState(false)
  const [assigningCase, setAssigningCase] = useState<string | null>(null)

  // Chat state
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Voice state
  const [isMuted, setIsMuted] = useState(true)
  const [voiceConnected, setVoiceConnected] = useState(false)

  const sortedPlayers = [...players].sort((a, b) =>
    new Date(a.joined_at ?? 0).getTime() - new Date(b.joined_at ?? 0).getTime()
  )
  const myIndex = sortedPlayers.findIndex((p) => p.user_id === currentUserId)
  const requiredCount = getRequiredCount(room.size as RoomSize, myIndex >= 0 ? myIndex : 0)

  // Determine which abilities are taken by previous players (locked)
  const lockedAbilities: AbilityId[] = []
  sortedPlayers.forEach((player, idx) => {
    if (idx < myIndex && player.abilities?.length) {
      player.abilities.forEach((ab: AbilityId) => {
        if (!lockedAbilities.includes(ab)) lockedAbilities.push(ab)
      })
    }
  })

  // Is my turn to pick?
  const previousPlayersReady = sortedPlayers.every((player, idx) => {
    if (idx >= myIndex) return true
    return (player.abilities?.length ?? 0) === getRequiredCount(room.size as RoomSize, idx)
  })
  const isMyTurn = previousPlayersReady && myIndex >= 0

  useEffect(() => {
    const myPlayer = players.find((p) => p.user_id === currentUserId)
    if (myPlayer?.abilities?.length) setMyAbilities(myPlayer.abilities)
  }, [])

  // Realtime subscriptions
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
        if (payload.new?.case_id) {
          window.location.reload()
        }
      }).subscribe()

    // Chat realtime
    const chatChannel = supabase
      .channel("room-chat:" + room.id)
      .on("postgres_changes" as any, {
        event: "INSERT", schema: "public", table: "room_chat",
        filter: "room_id=eq." + room.id,
      }, async (payload: any) => {
        const { data } = await supabase
          .from("room_chat")
          .select("*, profiles(username)")
          .eq("id", payload.new.id)
          .single()
        if (data) setChatMessages((prev) => [...prev, data])
      }).subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(roomChannel)
      supabase.removeChannel(chatChannel)
    }
  }, [room.id, room.room_code])

  // Load chat messages
  useEffect(() => {
    getChatMessages(room.id).then(setChatMessages)
  }, [room.id])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const toggleAbility = useCallback((ability: AbilityId) => {
    if (lockedAbilities.includes(ability)) return
    if (!isMyTurn) return
    setMyAbilities((prev) => {
      if (prev.includes(ability)) return prev.filter((a) => a !== ability)
      if (prev.length >= requiredCount) return prev
      return [...prev, ability]
    })
    setSaveSuccess(false)
  }, [requiredCount, lockedAbilities, isMyTurn])

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

  const handleOpenCaseSelector = async () => {
    setCasesLoading(true)
    setShowCaseSelector(true)
    const cases = await getActiveCases()
    setActiveCases(cases)
    setCasesLoading(false)
  }

  const handleAssignCase = async (caseId: string) => {
    setAssigningCase(caseId)
    await assignCaseToRoom(room.id, caseId)
    setAssigningCase(null)
    setShowCaseSelector(false)
    window.location.reload()
  }

  const handleRemoveCase = async () => {
    await removeCaseFromRoom(room.id)
    window.location.reload()
  }

  const handleSendChat = async () => {
    if (!chatInput.trim()) return
    setChatLoading(true)
    await sendChatMessage(room.id, chatInput)
    setChatInput("")
    setChatLoading(false)
  }

  const handleToggleVoice = () => {
    setIsMuted(!isMuted)
    setVoiceConnected(!voiceConnected)
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
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Player List */}
        <div className="lg:col-span-1 bg-panel-gray border border-border-gray rounded-xl p-5">
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
              const isLocked = idx < myIndex
              return (
                <div
                  key={player.id ?? player.user_id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border transition-colors",
                    isMe ? "border-signature-red/30 bg-signature-red/5" : "border-border-gray",
                    isLocked && "opacity-60"
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
                      {isLocked && <span className="font-mono text-[9px] uppercase tracking-wider text-muted-gray border border-muted-gray/30 rounded px-1">Locked</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {abilities.length > 0 ? abilities.map((ab) => (
                        <span key={ab} className={cn(
                          "font-mono text-[9px] uppercase tracking-wide border rounded px-1.5 py-0.5",
                          isLocked
                            ? "bg-muted-gray/10 text-muted-gray border-muted-gray/20"
                            : "bg-signature-red/15 text-signature-red border-signature-red/20"
                        )}>
                          {ABILITY_LABELS[ab]}
                        </span>
                      )) : (
                        <span className="font-franklin text-[11px] text-muted-gray italic">
                          {isLocked ? "Belum memilih" : "Belum memilih ability"}
                        </span>
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

          {/* Voice Chat Section */}
          <div className="mt-5 pt-4 border-t border-border-gray">
            <div className="accent-bar-left mb-3">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-gray">Voice Chat</h3>
            </div>
            <button
              onClick={handleToggleVoice}
              className={cn(
                "w-full py-2.5 rounded-xl font-franklin font-bold text-[12px] uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                voiceConnected
                  ? "bg-green-500/10 border border-green-500/30 text-green-400"
                  : "bg-surface-container border border-border-gray text-muted-gray hover:border-signature-red/50"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", voiceConnected ? "bg-green-400 animate-pulse" : "bg-muted-gray/40")} />
              {voiceConnected ? (isMuted ? "Muted" : "Connected") : "Join Voice"}
            </button>
          </div>
        </div>

        {/* Center: Ability Selection + Case Info */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          {/* Ability Selection */}
          <div className="bg-panel-gray border border-border-gray rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="accent-bar-left">
                <h2 className="font-mono text-xs uppercase tracking-widest text-ui-text-off-white">
                  {!isMyTurn ? "Menunggu Giliran..." : "Pilih Ability"}
                </h2>
              </div>
              <span className="font-mono text-[11px] text-muted-gray">
                <span className={cn(myAbilities.length === requiredCount ? "text-green-400" : "text-gold-win")}>
                  {myAbilities.length}
                </span>/{requiredCount}
              </span>
            </div>

            {!isMyTurn ? (
              <div className="text-center py-6">
                <p className="font-franklin text-[13px] text-muted-gray mb-2">
                  {myIndex < 0
                    ? "Bergabung ke room terlebih dahulu"
                    : "Giliran pemain sebelum kamu memilih ability"}
                </p>
                <p className="font-mono text-[10px] text-muted-gray/60">
                  Kamu pemain #{myIndex + 1}
                </p>
              </div>
            ) : (
              <>
                <p className="font-franklin text-[12px] text-muted-gray mb-4">
                  Pilih {requiredCount} ability untuk karakter kamu di kasus ini.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_ABILITIES.map((ability) => {
                    const isSelected = myAbilities.includes(ability)
                    const isAtMax = myAbilities.length >= requiredCount && !isSelected
                    const isTaken = lockedAbilities.includes(ability)
                    return (
                      <button
                        key={ability}
                        onClick={() => toggleAbility(ability)}
                        disabled={isAtMax || isTaken}
                        className={cn(
                          "relative text-left p-3 rounded-xl border transition-all text-start",
                          isSelected
                            ? "border-signature-red bg-signature-red/10"
                            : isTaken
                              ? "border-muted-gray/20 bg-muted-gray/5 opacity-40 cursor-not-allowed"
                              : "border-border-gray bg-surface-container hover:border-signature-red/50",
                          isAtMax && !isSelected && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-signature-red flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">v</span>
                          </span>
                        )}
                        {isTaken && (
                          <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-muted-gray/40 flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">x</span>
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
              </>
            )}
          </div>

          {/* Case Info */}
          <div className="bg-panel-gray border border-border-gray rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="accent-bar-left">
                <h2 className="font-mono text-xs uppercase tracking-widest text-ui-text-off-white">Kasus</h2>
              </div>
              {isHost && (
                <button
                  onClick={handleOpenCaseSelector}
                  className="font-mono text-[10px] uppercase px-3 py-1 rounded-lg border border-signature-red/30 text-signature-red hover:bg-signature-red/10 transition-colors"
                >
                  {room.case_id ? "Ganti Case" : "Pilih Case"}
                </button>
              )}
            </div>
            {room.cases ? (
              <div className="flex gap-4">
                {room.cases.thumbnail_url && (
                  <img src={room.cases.thumbnail_url} alt={room.cases.title}
                    className="w-16 h-16 rounded-lg object-cover border border-border-gray flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-chivo font-bold text-ui-text-off-white">{room.cases.title}</h3>
                  <span className="mt-1 inline-block font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-muted-gray/40 text-muted-gray">
                    {room.cases.difficulty}
                  </span>
                  <p className="font-franklin text-[12px] text-muted-gray mt-1.5 leading-relaxed line-clamp-2">
                    {room.cases.description}
                  </p>
                  {isHost && (
                    <button
                      onClick={handleRemoveCase}
                      className="mt-2 font-mono text-[9px] uppercase text-muted-gray hover:text-signature-red transition-colors"
                    >
                      Hapus Case
                    </button>
                  )}
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
                disabled={readyCount < sortedPlayers.length || sortedPlayers.length < 2 || isStarting || !room.case_id}
                className={cn(
                  "w-full py-3 rounded-xl font-franklin font-bold text-base uppercase tracking-widest transition-all",
                  readyCount >= sortedPlayers.length && sortedPlayers.length >= 2 && !isStarting && room.case_id
                    ? "bg-gradient-to-r from-signature-red to-deep-black text-white hover:-translate-y-1 hover:shadow-glow-red"
                    : "bg-surface-container-high text-muted-gray cursor-not-allowed"
                )}
              >
                {isStarting ? "Memulai..." : "Mulai Permainan"}
              </button>
            </div>
          )}
        </div>

        {/* Right: Chat */}
        <div className="lg:col-span-1 bg-panel-gray border border-border-gray rounded-xl flex flex-col" style={{ maxHeight: "calc(100vh - 160px)" }}>
          <div className="px-5 py-3 border-b border-border-gray">
            <div className="accent-bar-left">
              <h2 className="font-mono text-xs uppercase tracking-widest text-ui-text-off-white">Chat Room</h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {chatMessages.length === 0 ? (
              <div className="text-center py-8">
                <p className="font-franklin text-[12px] text-muted-gray italic">Belum ada pesan</p>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMe = msg.user_id === currentUserId
                const username = msg.profiles?.username ?? "Unknown"
                return (
                  <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-gray">{username}</span>
                      <span className="font-mono text-[8px] text-muted-gray/50">
                        {new Date(msg.created_at).toLocaleTimeString("id-ID", { hour12: false, hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className={cn(
                      "max-w-[80%] px-3 py-2 rounded-xl text-[13px] font-franklin",
                      isMe
                        ? "bg-signature-red/20 text-ui-text-off-white rounded-br-sm"
                        : "bg-surface-container text-ui-text-off-white rounded-bl-sm"
                    )}>
                      {msg.message}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t border-border-gray">
            <div className="flex items-center gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="Ketik pesan..."
                className="flex-1 bg-surface-container border border-border-gray rounded-xl px-4 py-2.5 font-franklin text-[13px] text-ui-text-off-white outline-none focus:border-signature-red/50 transition-colors"
              />
              <button
                onClick={handleSendChat}
                disabled={!chatInput.trim() || chatLoading}
                className={cn(
                  "px-4 py-2.5 rounded-xl font-franklin font-bold text-[12px] uppercase tracking-wider transition-all",
                  chatInput.trim() && !chatLoading
                    ? "bg-gradient-to-r from-signature-red to-deep-black text-white"
                    : "bg-surface-container-high text-muted-gray cursor-not-allowed"
                )}
              >
                {chatLoading ? "..." : "Kirim"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Case Selector Modal */}
      {showCaseSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-deep-black/80 backdrop-blur-sm" onClick={() => setShowCaseSelector(false)} />
          <div className="relative w-full max-w-2xl bg-panel-gray border border-border-gray rounded-xl shadow-card overflow-hidden max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-gray">
              <div>
                <p className="font-mono text-[10px] text-signature-red uppercase tracking-widest">SELECT CASE</p>
                <h2 className="font-chivo font-bold text-lg text-ui-text-off-white mt-0.5">Pilih Kasus untuk Room</h2>
              </div>
              <button
                onClick={() => setShowCaseSelector(false)}
                className="p-2 rounded-lg text-muted-gray hover:text-signature-red hover:bg-surface-container transition-all"
              >
                <span className="text-lg">x</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {casesLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 rounded-full border-2 border-signature-red/30 border-t-signature-red animate-spin mx-auto mb-3" />
                  <p className="font-franklin text-[13px] text-muted-gray">Memuat cases...</p>
                </div>
              ) : activeCases.length === 0 ? (
                <div className="text-center py-12">
                  <p className="font-franklin text-[13px] text-muted-gray">Tidak ada case aktif.</p>
                  <p className="font-mono text-[10px] text-muted-gray/60 mt-1">Buat case di admin panel terlebih dahulu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeCases.map((c) => (
                    <div
                      key={c.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border transition-all",
                        room.case_id === c.id
                          ? "border-signature-red bg-signature-red/10"
                          : "border-border-gray hover:border-signature-red/50"
                      )}
                    >
                      {c.thumbnail_url && (
                        <img src={c.thumbnail_url} alt={c.title}
                          className="w-14 h-14 rounded-lg object-cover border border-border-gray flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-chivo font-bold text-ui-text-off-white">{c.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded border border-muted-gray/30 text-muted-gray">
                            {c.difficulty}
                          </span>
                          <span className="font-mono text-[10px] text-muted-gray/60">{c.region}</span>
                        </div>
                        <p className="font-franklin text-[11px] text-muted-gray mt-1 line-clamp-1">{c.description}</p>
                      </div>
                      <button
                        onClick={() => handleAssignCase(c.id)}
                        disabled={assigningCase === c.id}
                        className={cn(
                          "px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all flex-shrink-0",
                          room.case_id === c.id
                            ? "bg-signature-red/20 text-signature-red border border-signature-red/30"
                            : "bg-surface-container text-muted-gray border border-border-gray hover:border-signature-red/50 hover:text-signature-red"
                        )}
                      >
                        {assigningCase === c.id ? "..." : room.case_id === c.id ? "Terpilih" : "Pilih"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
