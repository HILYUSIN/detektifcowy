"use client"

import { useEffect } from "react"

const REVEAL_STYLES = [
  "@keyframes fadeIn {",
  "  from { opacity: 0; transform: translateY(10px); }",
  "  to { opacity: 1; transform: translateY(0); }",
  "}",
  ".fade-in-1 { animation: fadeIn 1s ease forwards; }",
  ".fade-in-2 { animation: fadeIn 1s 1.5s ease both; }",
  ".fade-in-3 { animation: fadeIn 1s 2.5s ease both; }",
  ".fade-in-4 { animation: fadeIn 1s 3.5s ease both; }",
].join("\n")

interface CulpritRevealProps {
  culpritName: string
  culpritOccupation: string
  culpritPhotoUrl: string | null
  solutionNarrative: string
  onRevealComplete: () => void
}

export default function CulpritReveal({
  culpritName, culpritOccupation, culpritPhotoUrl,
  solutionNarrative, onRevealComplete
}: CulpritRevealProps) {
  useEffect(() => {
    const timer = setTimeout(onRevealComplete, 6000)
    return () => clearTimeout(timer)
  }, [onRevealComplete])

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 px-6" style={{ backgroundColor: "#000000" }}>
      <style dangerouslySetInnerHTML={{ __html: REVEAL_STYLES }} />
      <div className="fade-in-1 font-mono uppercase tracking-[0.3em] text-center" style={{ color: "#888", fontSize: "13px" }}>
        PELAKU SEBENARNYA ADALAH...
      </div>
      <div className="fade-in-2 flex flex-col items-center gap-4">
        <div className="w-32 h-32 rounded-full overflow-hidden" style={{ border: "4px solid #d63031", boxShadow: "0 0 30px rgba(214,48,49,0.4)" }}>
          {culpritPhotoUrl ? (
            <img src={culpritPhotoUrl} alt={culpritName} className="w-full h-full object-cover grayscale" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-chivo font-black text-[48px]" style={{ backgroundColor: "#1a1a1a", color: "#d63031" }}>
              {culpritName[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>
        <div className="text-center">
          <h2 className="font-chivo font-black uppercase" style={{ fontSize: "36px", color: "#f5f5f5", textShadow: "0 0 20px rgba(214,48,49,0.6)" }}>{culpritName}</h2>
          <p className="font-mono uppercase tracking-wider mt-1" style={{ color: "#888", fontSize: "12px" }}>{culpritOccupation}</p>
        </div>
      </div>
      {solutionNarrative && (
        <div className="fade-in-4 font-serif text-center max-w-lg leading-relaxed" style={{ color: "#e5e2e1", fontSize: "15px" }}>
          {solutionNarrative}
        </div>
      )}
      <button onClick={onRevealComplete} className="fade-in-4 font-mono uppercase tracking-widest transition-opacity hover:opacity-60" style={{ color: "#888", fontSize: "11px", marginTop: "16px" }}>
        Lanjutkan
      </button>
    </div>
  )
}