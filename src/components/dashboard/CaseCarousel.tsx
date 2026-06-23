"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { DIFFICULTY_LABELS, type Case, type Difficulty } from "@/types"

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy:   "bg-green-500/20 text-green-400 border-green-500/50",
  medium: "bg-gold-win/20 text-gold-win border-gold-win/50",
  hard:   "bg-orange-500/20 text-orange-400 border-orange-500/50",
  leader: "bg-signature-red/20 text-signature-red border-signature-red/50",
}

interface CaseCarouselProps {
  cases: Case[]
  onPlay?: (caseId: string) => void
}

export default function CaseCarousel({ cases, onPlay }: CaseCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" })
  }

  if (cases.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="font-mono text-mono-label text-muted-gray uppercase tracking-wider">Belum ada kasus tersedia</p>
      </div>
    )
  }

  return (
    <div className="relative group">
      {/* Left Arrow */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-panel-gray border border-border-gray flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-signature-red hover:text-signature-red text-muted-gray"
        aria-label="Scroll kiri"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Cards Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 scroll-smooth snap-x"
      >
        {cases.map((c, i) => (
          <CaseCard key={c.id} case_={c} index={i} onPlay={onPlay} />
        ))}
      </div>

      {/* Right Arrow */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-panel-gray border border-border-gray flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-signature-red hover:text-signature-red text-muted-gray"
        aria-label="Scroll kanan"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

function CaseCard({ case_: c, index, onPlay }: { case_: Case; index: number; onPlay?: (id: string) => void }) {
  const rotations = ["-rotate-1", "rotate-1", "-rotate-2", "rotate-0", "rotate-1"]
  const rot = rotations[index % rotations.length]

  return (
    <div
      onClick={() => onPlay?.(c.id)}
      className={cn(
        "flex-shrink-0 w-64 bg-paper-white border border-[#ccc] rounded overflow-hidden snap-start",
        "transition-all duration-300 hover:rotate-0 hover:-translate-y-2 hover:shadow-[0_0_25px_rgba(214,48,49,0.25)] cursor-pointer",
        rot
      )}
    >
      {/* Document Header Strip */}
      <div className="bg-deep-black px-3 py-1.5">
        <p className="font-mono text-[9px] text-muted-gray uppercase tracking-[0.15em]">
          DEPARTEMEN KEPOLISIAN - BERKAS RAHASIA
        </p>
      </div>

      {/* Thumbnail */}
      <div className="relative h-36 bg-surface-container overflow-hidden">
        {c.thumbnail_url ? (
          <img
            src={c.thumbnail_url}
            alt={c.title}
            className="w-full h-full object-cover grayscale contrast-125 opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Lock size={32} className="text-muted-gray/30" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-deep-black/60 to-transparent" />
        {/* Case ID badge */}
        <div className="absolute bottom-2 left-2">
          <span className="font-mono text-[10px] text-white/80 uppercase tracking-wider">
            KASUS #{c.id.substring(0, 6).toUpperCase()}
          </span>
        </div>
        {/* Difficulty stamp - rotated corner */}
        <div className="absolute top-2 right-2">
          <span className={cn(
            "font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border",
            DIFFICULTY_STYLES[c.difficulty]
          )}>
            {DIFFICULTY_LABELS[c.difficulty]}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3">
        <h3 className="font-chivo font-bold text-[15px] text-deep-black line-clamp-2 leading-tight mb-1">
          {c.title}
        </h3>
        <p className="font-serif text-[12px] text-deep-black/70 line-clamp-2 leading-relaxed">
          {c.description}
        </p>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#e0e0e0]">
          <span className="font-mono text-[10px] text-deep-black/50 uppercase tracking-wider">
            {c.play_count.toLocaleString()} kali dimainkan
          </span>
        </div>
      </div>
    </div>
  )
}