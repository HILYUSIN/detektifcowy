'use client'

import { useState } from 'react'
import { Gavel, X, AlertTriangle } from 'lucide-react'
import type { Suspect } from '@/types'

interface AccusationModalProps {
  suspects: Suspect[]
  culpritId: string
  onResult: (isCorrect: boolean) => void
  onClose: () => void
}

export default function AccusationModal({ suspects, culpritId, onResult, onClose }: AccusationModalProps) {
  const [selectedId, setSelectedId] = useState<string>("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const handleSubmit = async () => {
    if (!selectedId || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/accusation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspectId: selectedId, culpritId, reason }),
      })
      const data = await res.json()
      setIsCorrect(data.isCorrect)
      setResultMessage(data.message)
      // Notify parent after brief delay
      setTimeout(() => {
        onResult(data.isCorrect)
      }, 2200)
    } catch {
      setResultMessage('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] bg-deep-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Ajukan tuduhan"
    >
      <div className="bg-panel-gray border border-border-gray rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-gray">
          <div className="flex items-center gap-2">
            <Gavel size={18} className="text-signature-red" aria-hidden="true" />
            <span className="font-mono text-sm uppercase tracking-[0.2em] text-ui-text-off-white">
              AJUKAN TUDUHAN
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-muted-gray hover:text-on-surface transition-colors"
            aria-label="Tutup modal tuduhan"
          >
            <X size={18} />
          </button>
        </div>

        {/* Result state */}
        {resultMessage ? (
          <div className="px-6 py-10 text-center">
            <div
              className={`text-5xl mb-4 ${
                isCorrect ? 'text-gold-win' : 'text-signature-red'
              }`}
              aria-hidden="true"
            >
              {isCorrect ? '\u2714' : '\u2718'}
            </div>
            <p
              className={`font-chivo font-bold text-xl mb-2 ${
                isCorrect ? 'text-gold-win' : 'text-signature-red'
              }`}
            >
              {isCorrect ? 'Benar!' : 'Salah!'}
            </p>
            <p className="font-serif text-[15px] text-on-surface">{resultMessage}</p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            {/* Suspect list */}
            <div>
              <p className="font-mono text-[11px] text-muted-gray uppercase tracking-wider mb-3">
                Pilih Tersangka
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto hide-scrollbar">
                {suspects.map((suspect) => (
                  <label
                    key={suspect.id}
                    className={[
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      selectedId === suspect.id
                        ? 'border-signature-red bg-signature-red/5'
                        : 'border-border-gray hover:border-muted-gray',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="suspect"
                      value={suspect.id}
                      checked={selectedId === suspect.id}
                      onChange={() => setSelectedId(suspect.id)}
                      className="accent-signature-red"
                      aria-label={suspect.name}
                    />
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container flex-shrink-0">
                      {suspect.photo_url ? (
                        <img
                          src={suspect.photo_url}
                          alt={suspect.name}
                          className="w-full h-full object-cover grayscale"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-chivo font-bold text-sm text-muted-gray">
                            {suspect.name?.[0]?.toUpperCase() ?? '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-chivo font-bold text-sm text-ui-text-off-white truncate">
                        {suspect.name}
                      </p>
                      <p className="font-mono text-[11px] text-muted-gray truncate">
                        {suspect.occupation}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <p className="font-mono text-[11px] text-muted-gray uppercase tracking-wider mb-2">
                Alasan (Opsional)
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Tuliskan alasan tuduhan Anda..."
                className="w-full bg-surface-container border border-border-gray rounded p-3 text-sm text-on-surface font-franklin placeholder:text-muted-gray/50 focus:outline-none focus:border-signature-red resize-none"
                aria-label="Alasan tuduhan"
              />
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 bg-signature-red/5 border border-signature-red/20 rounded-lg px-4 py-3">
              <AlertTriangle size={14} className="text-signature-red flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="font-mono text-[11px] text-signature-red">
                Salah tuduh akan mengurangi <strong>-200 poin</strong>
              </p>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!selectedId || loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-signature-red to-deep-black text-white font-mono text-sm uppercase tracking-wider rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity"
              aria-label="Konfirmasi tuduhan"
            >
              {loading ? (
                <span className="animate-pulse">Memproses...</span>
              ) : (
                <>
                  <Gavel size={14} />
                  AJUKAN TUDUHAN
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}