'use client'

import { useState } from 'react'
import Image from 'next/image'
import DocumentCard from '@/components/case/DocumentCard'
import AbilityLockedCard from '@/components/case/AbilityLockedCard'
import type { Victim, AbilityId, NewsArticle } from '@/types'

interface KorbanTabProps {
  victim: Victim
  newsArticles?: NewsArticle[]
  playerAbilities: AbilityId[]
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3">
      <span className="block font-mono text-[10px] font-bold text-muted-gray uppercase tracking-wider">
        {label}
      </span>
      <span className="font-serif text-[15px] text-deep-black">{value}</span>
    </div>
  )
}

export default function KorbanTab({ victim, newsArticles = [], playerAbilities }: KorbanTabProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [openArticle, setOpenArticle] = useState<NewsArticle | null>(null)

  return (
    <div className="space-y-8">
      {/* Two-column header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Victim photos - polaroid style */}
        <div>
          <h3 className="font-mono text-xs text-muted-gray uppercase tracking-wider mb-3">Foto Korban</h3>
          <div className="flex flex-wrap gap-4">
            {victim.portrait_url ? (
              <button
                onClick={() => setLightboxSrc(victim.portrait_url!)}
                className="bg-paper-white p-2 pb-6 shadow-md hover:scale-105 transition-transform"
                aria-label="Foto korban"
              >
                <div className="relative w-24 h-24 overflow-hidden">
                  <img src={victim.portrait_url} alt="Foto korban" className="w-full h-full object-cover grayscale" />
                </div>
              </button>
            ) : (
              <div className="bg-paper-white p-2 pb-6 shadow-md">
                <div className="w-24 h-24 bg-[#ddd] flex items-center justify-center">
                  <span className="font-chivo font-bold text-2xl text-deep-black/40">
                    {victim.name?.[0] ?? '?'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Victim data card */}
        <div className="bg-paper-white border border-[#ccc] rounded p-5 shadow-sm">
          <FieldRow label="Nama" value={victim.name ?? '-'} />
          <FieldRow label="Usia" value={victim.age ? `${victim.age} tahun` : '-'} />
          <FieldRow label="Pekerjaan" value={victim.occupation ?? '-'} />
          <FieldRow label="Alamat" value={victim.address ?? '-'} />
          <FieldRow label="Tanggal Kejadian" value={victim.date_of_incident ?? '-'} />
        </div>
      </div>

      {/* Police report */}
      {victim.police_report && (
        <DocumentCard
          title="Laporan Polisi"
          subtitle="DIVISI RESERSE KRIMINAL"
          caseNumber={undefined}
          date={victim.date_of_incident}
          showStamp
        >
          <p className="whitespace-pre-line">{victim.police_report}</p>
        </DocumentCard>
      )}

      {/* Scene photos */}
      {victim.scene_photos && victim.scene_photos.length > 0 && (
        <div>
          <h3 className="font-mono text-xs text-muted-gray uppercase tracking-wider mb-3">Foto TKP</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {victim.scene_photos.map((src: string, i: number) => (
              <button
                key={i}
                onClick={() => setLightboxSrc(src)}
                className="relative aspect-square overflow-hidden rounded border border-border-gray hover:border-signature-red transition-colors"
                aria-label={`Foto TKP ${i + 1}`}
              >
                <img
                  src={src}
                  alt={`Foto TKP ${i + 1}`}
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* News articles */}
      {newsArticles.length > 0 && (
        <div>
          <h3 className="font-mono text-xs text-muted-gray uppercase tracking-wider mb-3">Artikel Berita</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {newsArticles.map((article) => (
              <button
                key={article.id}
                onClick={() => setOpenArticle(article)}
                className="text-left bg-surface-container border border-border-gray rounded-lg p-4 hover:border-signature-red transition-colors"
                aria-label={`Buka artikel: ${article.headline}`}
              >
                <p className="font-mono text-[10px] text-signature-red uppercase tracking-wider mb-1">
                  {article.publication}
                </p>
                <h4 className="font-chivo font-bold text-sm text-ui-text-off-white leading-tight">
                  {article.headline}
                </h4>
                <p className="font-mono text-[11px] text-muted-gray mt-1">{article.published_at}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[100] bg-deep-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Lightbox foto"
        >
          <div className="relative max-w-3xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxSrc}
              alt="Foto diperbesar"
              className="max-w-full max-h-[80vh] object-contain rounded shadow-2xl"
            />
            <button
              onClick={() => setLightboxSrc(null)}
              className="absolute top-2 right-2 bg-deep-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-signature-red transition-colors"
              aria-label="Tutup lightbox"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* News article modal */}
      {openArticle && (
        <div
          className="fixed inset-0 z-[100] bg-deep-black/80 flex items-center justify-center p-4"
          onClick={() => setOpenArticle(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Artikel berita"
        >
          <div
            className="bg-white max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b-4 border-signature-red px-6 pt-5 pb-3">
              <p className="font-chivo font-black text-signature-red text-lg uppercase tracking-widest">
                {openArticle.publication}
              </p>
            </div>
            <div className="px-6 py-5">
              <h2 className="font-chivo font-bold text-2xl text-deep-black leading-tight mb-2">
                {openArticle.headline}
              </h2>
              <p className="font-mono text-xs text-gray-500 mb-4">
                {openArticle.journalist && `Oleh ${openArticle.journalist} • `}{openArticle.published_at}
              </p>
              <div className="font-serif text-[15px] text-deep-black leading-relaxed whitespace-pre-line">
                {openArticle.body}
              </div>
            </div>
            <div className="px-6 pb-4 flex justify-end">
              <button
                onClick={() => setOpenArticle(null)}
                className="font-mono text-xs text-muted-gray hover:text-deep-black uppercase tracking-wider"
                aria-label="Tutup artikel"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}