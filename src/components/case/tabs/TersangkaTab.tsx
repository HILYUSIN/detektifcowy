'use client'

import { useState } from 'react'
import DocumentCard from '@/components/case/DocumentCard'
import AbilityLockedCard from '@/components/case/AbilityLockedCard'
import type { Suspect, AbilityId } from '@/types'

type SuspectSubTab = 'interogasi' | 'skck' | 'alibi' | 'dok_lainnya'

interface TersangkaTabProps {
  suspects: Suspect[]
  playerAbilities: AbilityId[]
  onAddToNotebook: (item: { title: string; content: string; type: string }) => void
}

function InitialAvatar({ name }: { name: string }) {
  return (
    <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
      <span className="font-chivo font-black text-4xl text-muted-gray/60">
        {name?.[0]?.toUpperCase() ?? '?'}
      </span>
    </div>
  )
}

function SuspectCard({ suspect, onView }: { suspect: Suspect; onView: () => void }) {
  const rotation = (parseInt(suspect.id, 36) % 5) - 2
  return (
    <div
      className="bg-paper-white border border-[#ccc] rounded shadow-md overflow-hidden"
      style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.2s' }}
    >
      {/* Portrait */}
      <div className="relative w-full aspect-[3/4] overflow-hidden">
        {suspect.photo_url ? (
          <img
            src={suspect.photo_url}
            alt={`Foto ${suspect.name}`}
            className="w-full h-full object-cover grayscale"
          />
        ) : (
          <InitialAvatar name={suspect.name} />
        )}
        <span className="absolute top-2 right-2 bg-signature-red text-white font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded">
          Tersangka
        </span>
      </div>
      {/* Info */}
      <div className="p-3">
        <h4 className="font-chivo font-bold text-[13px] text-deep-black leading-tight">{suspect.name}</h4>
        <p className="font-mono text-[11px] text-deep-black/60">{suspect.age ? `${suspect.age} thn` : ''} {suspect.occupation}</p>
        <button
          onClick={onView}
          className="mt-2 w-full py-1.5 font-mono text-[11px] uppercase tracking-wider border border-deep-black/20 text-deep-black hover:bg-deep-black hover:text-white transition-colors rounded"
          aria-label={`Lihat dokumen ${suspect.name}`}
        >
          Lihat Dokumen
        </button>
      </div>
    </div>
  )
}

function TypewriterQA({ qa }: { qa: { question: string; answer: string }[] }) {
  return (
    <div className="space-y-4">
      {qa.map((item, i) => (
        <div key={i}>
          <p className="font-mono text-[13px] text-deep-black/70 mb-1">T: {item.question}</p>
          <p className="font-serif text-[15px] text-deep-black leading-relaxed pl-3 border-l-2 border-deep-black/20">J: {item.answer}</p>
        </div>
      ))}
    </div>
  )
}

const SUB_TABS: { id: SuspectSubTab; label: string }[] = [
  { id: 'interogasi',   label: 'Interogasi'   },
  { id: 'skck',         label: 'SKCK'         },
  { id: 'alibi',        label: 'Alibi'        },
  { id: 'dok_lainnya',  label: 'Dok. Lainnya' },
]

function SuspectDetail({
  suspect,
  playerAbilities,
  onBack,
  onAddToNotebook,
}: {
  suspect: Suspect
  playerAbilities: AbilityId[]
  onBack: () => void
  onAddToNotebook: (item: { title: string; content: string; type: string }) => void
}) {
  const [subTab, setSubTab] = useState<SuspectSubTab>('interogasi')

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 font-mono text-xs text-muted-gray hover:text-on-surface uppercase tracking-wider transition-colors"
        aria-label="Kembali ke daftar tersangka"
      >
        &larr; Kembali
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border-gray flex-shrink-0">
          {suspect.photo_url ? (
            <img src={suspect.photo_url} alt={suspect.name} className="w-full h-full object-cover grayscale" />
          ) : (
            <InitialAvatar name={suspect.name} />
          )}
        </div>
        <div>
          <h3 className="font-chivo font-bold text-lg text-ui-text-off-white">{suspect.name}</h3>
          <p className="font-mono text-xs text-muted-gray">{suspect.occupation}</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-4 border-b border-border-gray">
        {SUB_TABS.map((st) => (
          <button
            key={st.id}
            onClick={() => setSubTab(st.id)}
            className={[
              'px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors',
              subTab === st.id
                ? 'text-signature-red border-b-2 border-signature-red'
                : 'text-muted-gray hover:text-on-surface border-b-2 border-transparent',
            ].join(' ')}
            aria-current={subTab === st.id ? 'page' : undefined}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      {subTab === 'interogasi' && (
        <DocumentCard
          title={`Berita Acara Pemeriksaan - ${suspect.name}`}
          subtitle="DIVISI RESERSE KRIMINAL"
          caseNumber={undefined}
          date={undefined}
          showStamp={false}
        >
          {suspect.interrogation ? (
            <p className="whitespace-pre-line font-serif text-[15px] text-deep-black leading-relaxed">{suspect.interrogation}</p>
          ) : (
            <p className="text-deep-black/50 italic">Belum ada catatan interogasi.</p>
          )}
        </DocumentCard>
      )}

      {subTab === 'skck' && (
        <DocumentCard
          title={`SKCK - ${suspect.name}`}
          subtitle="SURAT KETERANGAN CATATAN KEPOLISIAN"
          caseNumber={undefined}
          date={undefined}
          showStamp={false}
        >
          <div className="relative">
            {suspect.skck ? (
              <p className="whitespace-pre-line font-serif text-[15px] text-deep-black leading-relaxed">{suspect.skck}</p>
            ) : (
              <p className="text-deep-black/50 italic">Data SKCK tidak tersedia.</p>
            )}
            {/* BERSIH / MEMILIKI RIWAYAT stamp */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 rotate-[-12deg] border-4 border-green-700 text-green-700 font-chivo font-black text-[22px] uppercase tracking-widest opacity-30 px-3 py-1 select-none"
            >
              BERSIH
            </div>
          </div>
        </DocumentCard>
      )}

      {subTab === 'alibi' && (
        <DocumentCard
          title={`Alibi - ${suspect.name}`}
          subtitle="KETERANGAN ALIBI"
          showStamp={false}
        >
          {suspect.alibi ? (
            <p className="whitespace-pre-line">{suspect.alibi}</p>
          ) : (
            <p className="text-deep-black/50 italic">Tidak ada keterangan alibi.</p>
          )}
        </DocumentCard>
      )}

      {subTab === 'dok_lainnya' && (
        <div className="space-y-4">
          {suspect.other_docs && suspect.other_docs.length > 0 ? (
            suspect.other_docs.map((doc, i: number) =>
              doc.required_ability ? (
                <AbilityLockedCard
                  key={i}
                  requiredAbility={doc.required_ability as AbilityId}
                  playerAbilities={playerAbilities}
                >
                  <DocumentCard
                    title={doc.title}
                    showStamp={false}
                  >
                    <p className="whitespace-pre-line">{doc.content}</p>
                  </DocumentCard>
                </AbilityLockedCard>
              ) : (
                <DocumentCard key={i} title={doc.title} showStamp={false}>
                  <p className="whitespace-pre-line">{doc.content}</p>
                </DocumentCard>
              )
            )
          ) : (
            <div className="text-center py-10">
              <p className="font-mono text-xs text-muted-gray uppercase tracking-wider">Tidak ada dokumen lainnya.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function TersangkaTab({ suspects, playerAbilities, onAddToNotebook }: TersangkaTabProps) {
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null)

  if (!suspects || suspects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-mono text-xs text-muted-gray uppercase tracking-wider">Belum ada tersangka</p>
      </div>
    )
  }

  if (selectedSuspect) {
    return (
      <SuspectDetail
        suspect={selectedSuspect}
        playerAbilities={playerAbilities}
        onBack={() => setSelectedSuspect(null)}
        onAddToNotebook={onAddToNotebook}
      />
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {suspects.map((suspect) => (
        <SuspectCard
          key={suspect.id}
          suspect={suspect}
          onView={() => setSelectedSuspect(suspect)}
        />
      ))}
    </div>
  )
}