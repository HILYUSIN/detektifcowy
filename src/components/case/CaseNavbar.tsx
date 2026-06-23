'use client'

import { BookOpen, GitBranch, Gavel, MessageCircle } from 'lucide-react'

export type CaseTab = 'korban' | 'denah' | 'jejak' | 'tersangka' | 'saksi'

const TABS: { id: CaseTab; label: string }[] = [
  { id: 'korban',     label: 'Korban'     },
  { id: 'denah',      label: 'Denah'      },
  { id: 'jejak',      label: 'Jejak'      },
  { id: 'tersangka',  label: 'Tersangka'  },
  { id: 'saksi',      label: 'Saksi'      },
]

interface CaseNavbarProps {
  activeTab: CaseTab
  onTabChange: (tab: CaseTab) => void
  onNotebook: () => void
  onBenangMerah: () => void
  onAccusation: () => void
  onChat: () => void
}

export default function CaseNavbar({
  activeTab,
  onTabChange,
  onNotebook,
  onBenangMerah,
  onAccusation,
  onChat,
}: CaseNavbarProps) {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-panel-gray border-b-2 border-signature-red"
      role="navigation"
      aria-label="Case navigation"
    >
      {/* Row 1: Investigation tabs */}
      <div className="flex items-end gap-1 px-4 pt-3">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={[
                'px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors relative',
                isActive
                  ? 'text-signature-red border-b-2 border-signature-red'
                  : 'text-muted-gray hover:text-on-surface border-b-2 border-transparent',
              ].join(' ')}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Row 2: Action buttons */}
      <div className="flex items-center gap-2 px-4 py-2">
        <button
          onClick={onNotebook}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-border-gray text-muted-gray rounded hover:border-signature-red hover:text-on-surface transition-colors"
          aria-label="Buka Notebook"
        >
          <BookOpen size={14} />
          Notebook
        </button>

        <button
          onClick={onBenangMerah}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-border-gray text-muted-gray rounded hover:border-signature-red hover:text-on-surface transition-colors"
          aria-label="Buka Benang Merah"
        >
          <GitBranch size={14} />
          Benang Merah
        </button>

        <button
          onClick={onAccusation}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono uppercase tracking-wider bg-gradient-to-r from-signature-red to-deep-black text-white rounded hover:opacity-90 transition-opacity font-bold"
          aria-label="Ajukan Tuduhan"
        >
          <Gavel size={14} />
          Tuduh
        </button>

        <button
          onClick={onChat}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-border-gray text-muted-gray rounded hover:border-signature-red hover:text-on-surface transition-colors"
          aria-label="Buka Chat"
        >
          <MessageCircle size={14} />
          Chat
        </button>
      </div>
    </nav>
  )
}