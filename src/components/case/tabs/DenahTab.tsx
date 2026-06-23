'use client'

import { useState } from 'react'
import AbilityLockedCard from '@/components/case/AbilityLockedCard'
import type { AbilityId } from '@/types'

interface LocationMarker {
  id?: string
  label: string
  description?: string
  x: number  // percentage 0-100
  y: number  // percentage 0-100
}

interface MapData {
  city_map_url?: string | null
  scene_map_url?: string | null
  scene_photos?: string[]
  location_markers?: LocationMarker[]
}

interface DenahTabProps {
  mapData: MapData
  playerAbilities: AbilityId[]
}

function ZoomableMap({ src, alt, markers = [] }: { src: string; alt: string; markers?: LocationMarker[] }) {
  const [scale, setScale] = useState(1)
  const MIN_SCALE = 0.5
  const MAX_SCALE = 3

  const zoomIn = () => setScale((s) => Math.min(s + 0.25, MAX_SCALE))
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, MIN_SCALE))

  return (
    <div className="relative">
      <div className="overflow-hidden rounded border border-border-gray bg-surface-container" style={{ maxHeight: 480 }}>
        <div
          className="relative transition-transform duration-200 origin-top-left"
          style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          <img src={src} alt={alt} className="w-full h-auto block" />
          {markers.map((m) => (
            <div
              key={m.id}
              className="absolute group"
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
            >
              <div className="w-3 h-3 bg-signature-red rounded-full border-2 border-white shadow-md cursor-pointer" />
              <div className="absolute left-4 top-0 hidden group-hover:block bg-deep-black text-ui-text-off-white font-mono text-[11px] px-2 py-1 rounded whitespace-nowrap z-10 shadow">
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={zoomOut}
          disabled={scale <= MIN_SCALE}
          className="w-8 h-8 rounded border border-border-gray text-muted-gray hover:border-signature-red hover:text-on-surface transition-colors disabled:opacity-40 font-mono text-lg"
          aria-label="Perkecil peta"
        >
          -
        </button>
        <span className="font-mono text-xs text-muted-gray w-12 text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={zoomIn}
          disabled={scale >= MAX_SCALE}
          className="w-8 h-8 rounded border border-border-gray text-muted-gray hover:border-signature-red hover:text-on-surface transition-colors disabled:opacity-40 font-mono text-lg"
          aria-label="Perbesar peta"
        >
          +
        </button>
      </div>
    </div>
  )
}

function MapPlaceholder({ label }: { label: string }) {
  return (
    <div className="rounded border-2 border-dashed border-border-gray bg-surface-container flex items-center justify-center h-48">
      <p className="font-mono text-xs text-muted-gray text-center">{label}<br />Tidak tersedia</p>
    </div>
  )
}

export default function DenahTab({ mapData, playerAbilities }: DenahTabProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      {/* Section 1: Denah Kota */}
      <section>
        <h3 className="font-mono text-xs text-muted-gray uppercase tracking-wider mb-3">Denah Kota</h3>
        {mapData.city_map_url ? (
          <ZoomableMap src={mapData.city_map_url} alt="Denah kota" />
        ) : (
          <MapPlaceholder label="Denah Kota" />
        )}
      </section>

      {/* Section 2: Denah Area Kejadian */}
      <section>
        <h3 className="font-mono text-xs text-muted-gray uppercase tracking-wider mb-3">Denah Area Kejadian</h3>
        {mapData.scene_map_url ? (
          <ZoomableMap
            src={mapData.scene_map_url}
            alt="Denah area kejadian"
            markers={mapData.location_markers ?? []}
          />
        ) : (
          <MapPlaceholder label="Denah Area Kejadian" />
        )}
      </section>

      {/* Section 3: Foto TKP */}
      {mapData.scene_photos && mapData.scene_photos.length > 0 && (
        <section>
          <h3 className="font-mono text-xs text-muted-gray uppercase tracking-wider mb-3">Foto TKP</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {mapData.scene_photos.map((src, i) => (
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
        </section>
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
    </div>
  )
}