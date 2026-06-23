'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Search, Quote, PenLine, Camera, Plus } from 'lucide-react'

export interface NotebookEntry {
  id: string
  title: string
  content: string
  type: 'clue' | 'quote' | 'note' | 'photo'
  timestamp: Date
}

interface NotebookPanelProps {
  entries: NotebookEntry[]
  isOpen: boolean
  onClose: () => void
  onAddManual: (content: string) => void
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  clue:  <Search size={14} />,
  quote: <Quote  size={14} />,
  note:  <PenLine size={14} />,
  photo: <Camera size={14} />,
}

const TYPE_LABELS: Record<string, string> = {
  clue:  'Jejak',
  quote: 'Kutipan',
  note:  'Catatan',
  photo: 'Foto',
}

export default function NotebookPanel({ entries, isOpen, onClose, onAddManual }: NotebookPanelProps) {
  const [showInput, setShowInput] = useState(false)
  const [manualText, setManualText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (showInput) textareaRef.current?.focus()
  }, [showInput])

  const handleAddManual = () => {
    const text = manualText.trim()
    if (!text) return
    onAddManual(text)
    setManualText("")
    setShowInput(false)
  }

  const formatTime = (d: Date) =>
    new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <aside
        className={[
          'fixed top-0 right-0 z-50 h-full w-80 bg-panel-gray border-l border-border-gray flex flex-col transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        aria-label="Notebook"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-gray">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-ui-text-off-white">NOTEBOOK</span>
          <button
            onClick={onClose}
            className="text-muted-gray hover:text-on-surface transition-colors"
            aria-label="Tutup notebook"
          >
            <X size={16} />
          </button>
        </div>

        {/* Entries */}
        <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-2">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <PenLine size={32} className="text-muted-gray/30 mb-2" aria-hidden="true" />
              <p className="font-mono text-[11px] text-muted-gray uppercase tracking-wider">
                Belum ada catatan
              </p>
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-surface-container border border-border-gray rounded-lg p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-chivo font-bold text-xs text-ui-text-off-white leading-tight line-clamp-1">
                    {entry.title}
                  </span>
                  <span className="flex items-center gap-1 flex-shrink-0 bg-surface-container-high font-mono text-[10px] text-muted-gray px-1.5 py-0.5 rounded uppercase">
                    {TYPE_ICONS[entry.type]}
                    {TYPE_LABELS[entry.type] ?? entry.type}
                  </span>
                </div>
                <p className="font-franklin text-[12px] text-muted-gray line-clamp-2 leading-relaxed">
                  {entry.content}
                </p>
                <p className="font-mono text-[10px] text-muted-gray/50 mt-1">
                  {formatTime(entry.timestamp)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Add manual note */}
        <div className="border-t border-border-gray p-3">
          {showInput ? (
            <div className="space-y-2">
              <textarea
                ref={textareaRef}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                rows={3}
                placeholder="Tulis catatan..."
                className="w-full bg-surface-container border border-border-gray rounded p-2 text-sm text-on-surface font-franklin placeholder:text-muted-gray/50 focus:outline-none focus:border-signature-red resize-none"
                aria-label="Tulis catatan manual"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddManual}
                  disabled={!manualText.trim()}
                  className="flex-1 py-1.5 bg-signature-red text-white font-mono text-xs uppercase tracking-wider rounded hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  Simpan
                </button>
                <button
                  onClick={() => { setShowInput(false); setManualText("") }}
                  className="px-3 py-1.5 border border-border-gray text-muted-gray font-mono text-xs uppercase tracking-wider rounded hover:border-signature-red transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowInput(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 border border-border-gray text-muted-gray font-mono text-xs uppercase tracking-wider rounded hover:border-signature-red hover:text-on-surface transition-colors"
              aria-label="Tambah catatan manual"
            >
              <Plus size={12} />
              Tambah Catatan Manual
            </button>
          )}
        </div>
      </aside>
    </>
  )
}