'use client'

import { useState } from 'react'
import { Search, FileText, Camera, Mic, CheckCircle, Plus } from 'lucide-react'
import AbilityLockedCard from '@/components/case/AbilityLockedCard'
import type { Clue, AbilityId } from '@/types'

interface JejjakTabProps {
  clues: Clue[]
  playerAbilities: AbilityId[]
  onAddToNotebook: (clue: Clue) => void
}

const TYPE_LABELS: Record<string, string> = {
  fisik: 'Fisik',
  digital: 'Digital',
  dokumen: 'Dokumen',
  kesaksian: 'Kesaksian',
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  fisik: <Search size={32} className="text-muted-gray/40" />,
  digital: <FileText size={32} className="text-muted-gray/40" />,
  dokumen: <FileText size={32} className="text-muted-gray/40" />,
  kesaksian: <Mic size={32} className="text-muted-gray/40" />,
}

function ClueCard({
  clue,
  playerAbilities,
  onAddToNotebook,
}: {
  clue: Clue
  playerAbilities: AbilityId[]
  onAddToNotebook: (clue: Clue) => void
}) {
  const [saved, setSaved] = useState(false)
  const [animating, setAnimating] = useState(false)

  const handleAdd = () => {
    if (saved) return
    setAnimating(true)
    onAddToNotebook(clue)
    setTimeout(() => {
      setAnimating(false)
      setSaved(true)
    }, 300)
  }

  const cardContent = (
    <div className="bg-panel-gray border border-border-gray rounded-xl overflow-hidden flex flex-col h-full">
      {/* Image area */}
      <div className="relative aspect-video bg-surface-container flex items-center justify-center overflow-hidden">
        {clue.image_url ? (
          <img
            src={clue.image_url}
            alt={clue.title}
            className="w-full h-full object-cover grayscale"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            {TYPE_ICONS[clue.type] ?? <Search size={32} className="text-muted-gray/40" />}
          </div>
        )}
        {/* Type badge */}
        <span className="absolute top-2 left-2 font-mono text-[10px] uppercase tracking-wider bg-deep-black/70 text-muted-gray border border-border-gray px-2 py-0.5 rounded">
          {TYPE_LABELS[clue.type] ?? clue.type}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <h4 className="font-chivo font-bold text-sm text-ui-text-off-white leading-tight mb-1">
          {clue.title}
        </h4>
        <p className="font-franklin text-[13px] text-muted-gray flex-1 leading-relaxed">
          {clue.description}
        </p>

        {/* Add to notebook button */}
        <button
          onClick={handleAdd}
          disabled={saved}
          className={[
            'mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all',
            animating ? 'scale-95' : 'scale-100',
            saved
              ? 'bg-surface-container text-muted-gray cursor-default'
              : 'border border-border-gray text-muted-gray hover:border-signature-red hover:text-on-surface',
          ].join(' ')}
          aria-label={saved ? 'Sudah tersimpan di notebook' : 'Tambah ke notebook'}
        >
          {saved ? (
            <>
              <CheckCircle size={12} />
              Tersimpan
            </>
          ) : (
            <>
              <Plus size={12} />
              Tambah ke Notebook
            </>
          )}
        </button>
      </div>
    </div>
  )

  if (clue.required_ability) {
    return (
      <AbilityLockedCard
        requiredAbility={clue.required_ability as AbilityId}
        playerAbilities={playerAbilities}
      >
        {cardContent}
      </AbilityLockedCard>
    )
  }

  return cardContent
}

export default function JejjakTab({ clues, playerAbilities, onAddToNotebook }: JejjakTabProps) {
  if (!clues || clues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Search size={40} className="text-muted-gray/40 mb-3" aria-hidden="true" />
        <p className="font-mono text-xs text-muted-gray uppercase tracking-wider">Belum ada jejak ditemukan</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {clues.map((clue) => (
        <ClueCard
          key={clue.id}
          clue={clue}
          playerAbilities={playerAbilities}
          onAddToNotebook={onAddToNotebook}
        />
      ))}
    </div>
  )
}