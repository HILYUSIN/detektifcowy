"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import CaseNavbar, { CaseTab } from "@/components/case/CaseNavbar"
import BottomStatusBar from "@/components/case/BottomStatusBar"
import NotebookPanel, { NotebookEntry } from "@/components/case/NotebookPanel"
import AccusationModal from "@/components/case/AccusationModal"
import ChatPanel from "@/components/case/ChatPanel"
import KorbanTab from "@/components/case/tabs/KorbanTab"
import DenahTab from "@/components/case/tabs/DenahTab"
import JejjakTab from "@/components/case/tabs/JejjakTab"
import TersangkaTab from "@/components/case/tabs/TersangkaTab"
import SaksiTab from "@/components/case/tabs/SaksiTab"
import TemuanDigitalPanel from "@/components/case/digital/TemuanDigitalPanel"
import BenangMerahBoard from "@/components/case/BenangMerahBoard"
import DisconnectWarning from "@/components/case/DisconnectWarning"
import { createClient } from "@/lib/supabase/client"
import { saveGameResult } from "@/lib/game/saveResult"
import { calculateScore } from "@/lib/game/rank"
import type { CaseContent, AbilityId, Clue, BoardNode, BoardConnection } from "@/types"

interface CaseClientProps {
  room: any
  caseData: any
  caseContent: CaseContent | null
  currentPlayer: any
  currentUserId: string
}

function generateId() {
  return Math.random().toString(36).slice(2)
}

export default function CaseClient({
  room,
  caseData,
  caseContent,
  currentPlayer,
  currentUserId,
}: CaseClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<CaseTab>("korban")
  const [showNotebook, setShowNotebook] = useState(false)
  const [showBenangMerah, setShowBenangMerah] = useState(false)
  const [showAccusation, setShowAccusation] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [notebookEntries, setNotebookEntries] = useState<NotebookEntry[]>([])
  const [score, setScore] = useState(0)
  const [wrongAccusations, setWrongAccusations] = useState(0)
  const [startTime] = useState<Date>(new Date())
  const [isGameOver, setIsGameOver] = useState(false)
  const [disconnectedUser, setDisconnectedUser] = useState<string | null>(null)
  const [disconnectedAt, setDisconnectedAt] = useState<Date | null>(null)
  const [boardNodes, setBoardNodes] = useState<BoardNode[]>([])
  const [boardConnections, setBoardConnections] = useState<BoardConnection[]>([])
  const boardLoaded = useRef(false)

  // Fix: difficulty comes from caseData, not room
  const playerAbilities: AbilityId[] = currentPlayer?.abilities ?? []
  const difficulty: string = caseData?.difficulty ?? "easy"

  const roomPlayers = room?.room_players ?? []
  const connectedPlayers = roomPlayers.filter((p: any) => p.is_connected !== false).length
  const totalPlayers = roomPlayers.length

  // Timer: only hard/leader, from caseData.difficulty
  const timerDuration: number | null =
    difficulty === "hard" || difficulty === "leader" ? 60 * 60 : null

  // Load board nodes from DB on mount
  useEffect(() => {
    if (boardLoaded.current || !room?.id) return
    boardLoaded.current = true
    const supabase = createClient()
    Promise.all([
      supabase.from("board_nodes").select("*").eq("room_id", room.id),
      supabase.from("board_connections").select("*").eq("room_id", room.id),
    ]).then(([nodesRes, connsRes]) => {
      if (nodesRes.data) setBoardNodes(nodesRes.data as BoardNode[])
      if (connsRes.data) setBoardConnections(connsRes.data as BoardConnection[])
    })
  }, [room?.id])

  // Watch for disconnect
  useEffect(() => {
    if (!room?.id) return
    const supabase = createClient()
    const channel = supabase
      .channel("case-players:" + room.id)
      .on("postgres_changes" as any, {
        event: "UPDATE", schema: "public", table: "room_players",
        filter: "room_id=eq." + room.id,
      }, (payload: any) => {
        const p = payload.new
        if (p.user_id === currentUserId) return
        if (!p.is_connected && p.disconnect_at) {
          const username = p.username ?? "Pemain"
          setDisconnectedUser(username)
          setDisconnectedAt(new Date(p.disconnect_at))
        } else if (p.is_connected) {
          setDisconnectedUser(null)
          setDisconnectedAt(null)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [room?.id, currentUserId])

  const handleAddToNotebook = useCallback(
    (item: { title: string; content: string; type: string }) => {
      setNotebookEntries((prev) => [
        {
          id: generateId(),
          title: item.title,
          content: item.content,
          type: (item.type as NotebookEntry["type"]) || "note",
          timestamp: new Date(),
        },
        ...prev,
      ])
    },
    []
  )

  const handleAddClueToNotebook = useCallback(
    (clue: Clue) => {
      handleAddToNotebook({ title: clue.title, content: clue.description, type: "clue" })
    },
    [handleAddToNotebook]
  )

  const handleAddManualNote = useCallback(
    (content: string) => {
      handleAddToNotebook({ title: "Catatan Manual", content, type: "note" })
    },
    [handleAddToNotebook]
  )

  const finishGame = useCallback(async (isWin: boolean, accusedSuspectId?: string, accusedName?: string) => {
    if (isGameOver) return
    setIsGameOver(true)

    const supabase = createClient()
    const durationSeconds = Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
    const scoring = calculateScore({
      isWin,
      durationSeconds,
      puzzleCompleted: boardConnections.length >= 3,
      wrongAccusations,
    })

    const culpritSuspect = caseContent?.suspects?.find((s: any) => s.id === caseContent?.culprit_id)

    // 1. Save game_results to DB
    await supabase.from("game_results").insert({
      room_id: room.id,
      case_id: caseData?.id,
      is_win: isWin,
      culprit_id: caseContent?.culprit_id ?? "",
      accused_id: accusedSuspectId ?? null,
      base_score: scoring.baseScore,
      speed_bonus: scoring.speedBonus,
      puzzle_bonus: scoring.puzzleBonus,
      penalty: scoring.penalty,
      total_score: scoring.total,
      xp_earned: scoring.xpEarned,
      duration_seconds: durationSeconds,
    })

    // 2. Award XP to current player
    if (scoring.xpEarned > 0) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_xp")
        .eq("id", currentUserId)
        .single()
      if (profile) {
        await supabase.from("profiles")
          .update({ total_xp: (profile.total_xp ?? 0) + scoring.xpEarned })
          .eq("id", currentUserId)
      }
    }

    // 3. Update room status to finished
    await supabase.from("rooms").update({ status: "finished", finished_at: new Date().toISOString() }).eq("id", room.id)

    // 4. Build players list for result screen
    const players = roomPlayers.map((p: any) => ({
      userId: p.user_id,
      username: p.profiles?.username ?? p.username ?? "Pemain",
      rank: p.profiles?.rank ?? "cadet_investigator",
    }))

    // 5. Save result to localStorage for result page
    saveGameResult({
      isWin,
      loseReason: isWin ? undefined : "wrong_accusation",
      caseTitle: caseData?.title ?? "",
      culpritName: culpritSuspect?.name ?? "Tidak Diketahui",
      culpritOccupation: culpritSuspect?.occupation ?? "",
      culpritPhotoUrl: culpritSuspect?.photo_url ?? null,
      solutionNarrative: caseContent?.solution_narrative ?? "",
      accusedName: accusedName,
      baseScore: scoring.baseScore,
      speedBonus: scoring.speedBonus,
      puzzleBonus: scoring.puzzleBonus,
      penalty: scoring.penalty,
      totalScore: scoring.total,
      xpEarned: scoring.xpEarned,
      durationSeconds,
      players,
      currentUserId,
      earnedBadges: [],
    })

    // 6. Navigate to result
    router.push("/result")
  }, [isGameOver, startTime, wrongAccusations, boardConnections.length, caseContent, caseData, room, roomPlayers, currentUserId, router])

  const handleAccusationResult = useCallback(
    (isCorrect: boolean, accusedSuspectId: string) => {
      const accused = caseContent?.suspects?.find((s: any) => s.id === accusedSuspectId)
      if (isCorrect) {
        setScore((s) => s + 500)
      } else {
        setScore((s) => Math.max(0, s - 200))
        setWrongAccusations((n) => n + 1)
      }
      setShowAccusation(false)
      // Always finish game on accusation
      finishGame(isCorrect, accusedSuspectId, accused?.name)
    },
    [caseContent, finishGame]
  )

  if (!caseContent) {
    return (
      <main className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-xs text-muted-gray uppercase tracking-wider mb-2">Data kasus tidak tersedia</p>
          <p className="font-franklin text-sm text-muted-gray">Konten kasus belum dikonfigurasi oleh admin.</p>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-deep-black">
      <DisconnectWarning
        disconnectedUsername={disconnectedUser}
        disconnectedAt={disconnectedAt}
        timeoutMs={300000}
      />

      <CaseNavbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNotebook={() => setShowNotebook((v) => !v)}
        onBenangMerah={() => setShowBenangMerah((v) => !v)}
        onAccusation={() => setShowAccusation(true)}
        onChat={() => setShowChat((v) => !v)}
      />

      <main className="pt-[112px] pb-16 px-4 md:px-6 lg:px-8 max-w-6xl mx-auto">
        {activeTab === "korban" && caseContent.victim && (
          <KorbanTab
            victim={caseContent.victim}
            newsArticles={caseContent.news_articles ?? []}
            playerAbilities={playerAbilities}
          />
        )}

        {activeTab === "denah" && (
          <DenahTab
            mapData={{
              city_map_url: caseContent.maps?.city_map_url ?? null,
              scene_map_url: caseContent.maps?.scene_map_url ?? null,
              scene_photos: (caseContent.maps?.scene_photos ?? []).map((p) => p.url),
              location_markers: caseContent.maps?.location_markers ?? [],
            }}
            playerAbilities={playerAbilities}
          />
        )}

        {activeTab === "jejak" && (
          <JejjakTab
            clues={caseContent.clues ?? []}
            playerAbilities={playerAbilities}
            onAddToNotebook={handleAddClueToNotebook}
          />
        )}

        {activeTab === "tersangka" && (
          <TersangkaTab
            suspects={caseContent.suspects ?? []}
            playerAbilities={playerAbilities}
            onAddToNotebook={handleAddToNotebook}
          />
        )}

        {activeTab === "saksi" && (
          <SaksiTab
            witnesses={caseContent.witnesses ?? []}
            caseId={caseData?.id ?? ""}
            playerAbilities={playerAbilities}
            onAddToNotebook={handleAddToNotebook}
          />
        )}

        {activeTab === "korban" && caseContent.digital_findings && (
          <div className="mt-8">
            <div className="accent-bar-left mb-4">
              <h3 className="font-chivo font-bold text-headline-md text-ui-text-off-white uppercase">Temuan Digital</h3>
              <p className="font-franklin text-[13px] text-muted-gray mt-0.5">Perangkat digital milik korban</p>
            </div>
            <TemuanDigitalPanel
              findings={caseContent.digital_findings}
              playerAbilities={playerAbilities}
            />
          </div>
        )}
      </main>

      <BottomStatusBar
        roomCode={room?.room_code ?? ""}
        connectedPlayers={connectedPlayers}
        totalPlayers={totalPlayers}
        timerSeconds={timerDuration}
        score={score}
        difficulty={difficulty}
      />

      <NotebookPanel
        entries={notebookEntries}
        isOpen={showNotebook}
        onClose={() => setShowNotebook(false)}
        onAddManual={handleAddManualNote}
      />

      {/* Chat Panel - in-game */}
      <ChatPanel
        roomId={room?.id ?? ""}
        userId={currentUserId}
        username={currentPlayer?.profiles?.username ?? currentPlayer?.username ?? "Pemain"}
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />

      {showBenangMerah && (
        <BenangMerahBoard
          roomId={room?.id ?? ""}
          initialNodes={boardNodes}
          initialConnections={boardConnections}
          onClose={() => setShowBenangMerah(false)}
        />
      )}

      {showAccusation && caseContent.suspects && (
        <AccusationModal
          suspects={caseContent.suspects}
          culpritId={caseContent.culprit_id ?? ""}
          onResult={handleAccusationResult}
          onClose={() => setShowAccusation(false)}
        />
      )}
    </div>
  )
}