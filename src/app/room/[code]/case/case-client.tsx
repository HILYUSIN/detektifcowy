'use client'

import { useState, useEffect, useCallback } from 'react'
import CaseNavbar, { CaseTab } from '@/components/case/CaseNavbar'
import BottomStatusBar from '@/components/case/BottomStatusBar'
import NotebookPanel, { NotebookEntry } from '@/components/case/NotebookPanel'
import AccusationModal from '@/components/case/AccusationModal'
import KorbanTab from '@/components/case/tabs/KorbanTab'
import DenahTab from '@/components/case/tabs/DenahTab'
import JejjakTab from '@/components/case/tabs/JejjakTab'
import TersangkaTab from '@/components/case/tabs/TersangkaTab'
import SaksiTab from '@/components/case/tabs/SaksiTab'
import TemuanDigitalPanel from '@/components/case/digital/TemuanDigitalPanel'
import BenangMerahBoard from '@/components/case/BenangMerahBoard'
import type { CaseContent, AbilityId, Clue } from '@/types'

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
  const [activeTab, setActiveTab] = useState<CaseTab>('korban')
  const [showNotebook, setShowNotebook] = useState(false)
  const [showBenangMerah, setShowBenangMerah] = useState(false)
  const [showAccusation, setShowAccusation] = useState(false)
  const [notebookEntries, setNotebookEntries] = useState<NotebookEntry[]>([])
  const [score, setScore] = useState(0)
  const [wrongAccusations, setWrongAccusations] = useState(0)
  const [startTime] = useState<Date>(new Date())

  const playerAbilities: AbilityId[] = currentPlayer?.abilities ?? []
  const difficulty: string = room?.difficulty ?? 'normal'

  // Connected players
  const roomPlayers = room?.room_players ?? []
  const connectedPlayers = roomPlayers.filter((p: any) => p.is_connected !== false).length
  const totalPlayers = roomPlayers.length

  // Timer (only for hard/leader mode) - start from a fixed duration if applicable
  const timerDuration: number | null =
    difficulty === 'hard' || difficulty === 'leader' ? (caseData?.timer_minutes ?? 60) * 60 : null

  const handleAddToNotebook = useCallback(
    (item: { title: string; content: string; type: string }) => {
      setNotebookEntries((prev) => [
        {
          id: generateId(),
          title: item.title,
          content: item.content,
          type: (item.type as NotebookEntry['type']) || 'note',
          timestamp: new Date(),
        },
        ...prev,
      ])
    },
    []
  )

  const handleAddClueToNotebook = useCallback(
    (clue: Clue) => {
      handleAddToNotebook({
        title: clue.title,
        content: clue.description,
        type: 'clue',
      })
    },
    [handleAddToNotebook]
  )

  const handleAddManualNote = useCallback(
    (content: string) => {
      handleAddToNotebook({ title: 'Catatan Manual', content, type: 'note' })
    },
    [handleAddToNotebook]
  )

  const handleAccusationResult = useCallback(
    (isCorrect: boolean) => {
      if (isCorrect) {
        setScore((s) => s + 500)
      } else {
        setScore((s) => Math.max(0, s - 200))
        setWrongAccusations((n) => n + 1)
      }
      setShowAccusation(false)
    },
    []
  )

  // Null guard for case content
  if (!caseContent) {
    return (
      <main className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-xs text-muted-gray uppercase tracking-wider mb-2">
            Data kasus tidak tersedia
          </p>
          <p className="font-franklin text-sm text-muted-gray">
            Konten kasus belum dikonfigurasi oleh admin.
          </p>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-deep-black">
      {/* Fixed top navbar */}
      <CaseNavbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNotebook={() => setShowNotebook((v) => !v)}
        onBenangMerah={() => setShowBenangMerah((v) => !v)}
        onAccusation={() => setShowAccusation(true)}
        onChat={() => {}}
      />

      {/* Scrollable main content */}
      <main
        className="pt-[112px] pb-16 px-4 md:px-6 lg:px-8 max-w-6xl mx-auto"
        id="main-content"
      >
        {activeTab === 'korban' && caseContent.victim && (
          <KorbanTab
            victim={caseContent.victim}
            newsArticles={caseContent.news_articles ?? []}
            playerAbilities={playerAbilities}
          />
        )}

        {activeTab === 'denah' && (
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

        {activeTab === 'jejak' && (
          <JejjakTab
            clues={caseContent.clues ?? []}
            playerAbilities={playerAbilities}
            onAddToNotebook={handleAddClueToNotebook}
          />
        )}

        {activeTab === 'tersangka' && (
          <TersangkaTab
            suspects={caseContent.suspects ?? []}
            playerAbilities={playerAbilities}
            onAddToNotebook={handleAddToNotebook}
          />
        )}

        {activeTab === 'saksi' && (
          <SaksiTab
            witnesses={caseContent.witnesses ?? []}
            caseId={caseData?.id ?? ''}
            playerAbilities={playerAbilities}
            onAddToNotebook={handleAddToNotebook}
          />
        )}

        {/* Temuan Digital - always shown below active tab if digital_findings exist */}
        {activeTab === 'korban' && caseContent.digital_findings && (
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

      {/* Fixed bottom status bar */}
      <BottomStatusBar
        roomCode={room?.room_code ?? ''}
        connectedPlayers={connectedPlayers}
        totalPlayers={totalPlayers}
        timerSeconds={timerDuration}
        score={score}
        difficulty={difficulty}
      />

      {/* Notebook panel */}
      <NotebookPanel
        entries={notebookEntries}
        isOpen={showNotebook}
        onClose={() => setShowNotebook(false)}
        onAddManual={handleAddManualNote}
      />

      {/* Benang Merah Board */}
      {showBenangMerah && (
        <BenangMerahBoard
          roomId={room?.id ?? ''}
          initialNodes={[]}
          initialConnections={[]}
          onClose={() => setShowBenangMerah(false)}
        />
      )}

      {/* Accusation modal */}
      {showAccusation && caseContent.suspects && (
        <AccusationModal
          suspects={caseContent.suspects}
          culpritId={caseContent.culprit_id ?? ''}
          onResult={handleAccusationResult}
          onClose={() => setShowAccusation(false)}
        />
      )}
    </div>
  )
}