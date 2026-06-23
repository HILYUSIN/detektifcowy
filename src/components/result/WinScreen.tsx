"use client"

import { useEffect, useRef } from "react"

const WIN_STYLES = [
  "@keyframes stampIn {",
  "  0% { transform: rotate(-15deg) scale(0); opacity: 0; }",
  "  80% { transform: rotate(-15deg) scale(1.1); opacity: 1; }",
  "  100% { transform: rotate(-15deg) scale(1); opacity: 1; }",
  "}",
  "@keyframes floatUp {",
  "  0% { transform: translateY(0) scale(0); opacity: 0; }",
  "  30% { opacity: 1; }",
  "  100% { transform: translateY(-120px) scale(1); opacity: 0; }",
  "}",
  ".stamp-win { animation: stampIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }",
  ".particle { position: absolute; border-radius: 50%; pointer-events: none; }",
].join("\n")

interface WinScreenProps {
  caseTitle: string
  baseScore: number
  speedBonus: number
  puzzleBonus: number
  penalty: number
  totalScore: number
  xpEarned: number
  durationSeconds: number
  players: { userId: string; username: string; rank: string }[]
  currentUserId: string
  earnedBadges?: { name: string; description: string; icon: string }[]
  onPlayAgain: () => void
  onDashboard: () => void
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m > 0) return m + " menit " + sec + " detik"
  return sec + " detik"
}

export default function WinScreen({
  caseTitle, baseScore, speedBonus, puzzleBonus, penalty, totalScore,
  xpEarned, durationSeconds, players, currentUserId, earnedBadges = [],
  onPlayAgain, onDashboard
}: WinScreenProps) {
  const particlesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = particlesRef.current
    if (!container) return
    container.innerHTML = ""
    for (let i = 0; i < 50; i++) {
      const p = document.createElement("div")
      p.className = "particle"
      const size = 2 + Math.random() * 8
      const duration = 2 + Math.random() * 3
      const delay = Math.random() * 5
      p.style.cssText = [
        "background: radial-gradient(circle, #f9ca24, transparent)",
        "width: " + size + "px",
        "height: " + size + "px",
        "left: " + Math.random() * 100 + "%",
        "top: " + Math.random() * 100 + "%",
        "animation: floatUp " + duration + "s " + delay + "s ease-in-out infinite",
      ].join(";")
      container.appendChild(p)
    }
    return () => { if (particlesRef.current) particlesRef.current.innerHTML = "" }
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden py-12 px-4" style={{ backgroundColor: "#0d0d0d" }}>
      <style dangerouslySetInnerHTML={{ __html: WIN_STYLES }} />
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none" aria-hidden="true" />
      <div className="absolute top-1/2 left-1/2 pointer-events-none" style={{ transform: "translate(-50%, -50%)", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(249,202,36,0.08), transparent)", borderRadius: "50%" }} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-8">
        <div className="stamp-win flex items-center justify-center w-44 h-44 rounded-full" style={{ border: "8px solid #f9ca24", boxShadow: "0 0 30px rgba(249,202,36,0.4), inset 0 0 20px rgba(249,202,36,0.1)" }}>
          <div className="font-chivo font-black uppercase text-center leading-tight" style={{ color: "#f9ca24", fontSize: "20px", textShadow: "0 0 10px rgba(249,202,36,0.8)" }}>CASE<br />CLOSED</div>
        </div>
        <div className="text-center">
          <h1 className="font-chivo font-black uppercase" style={{ fontSize: "36px", color: "#f5f5f5", letterSpacing: "0.05em" }}>KASUS TERSELESAIKAN</h1>
          <p className="font-serif italic mt-2" style={{ color: "#f9ca24", fontSize: "16px" }}>Keadilan telah ditegakkan.</p>
          {caseTitle && <p className="font-mono text-[11px] uppercase tracking-widest mt-1" style={{ color: "#888" }}>{caseTitle}</p>}
        </div>
        {players.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {players.map((p) => (
              <div key={p.userId} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-chivo font-black text-[18px]" style={{ backgroundColor: "#2a2a2a", border: p.userId === currentUserId ? "2px solid #d63031" : "2px solid #2a2a2a", color: "#f5f5f5" }}>{p.username[0]?.toUpperCase()}</div>
                <span className="font-mono text-[10px]" style={{ color: "#888" }}>{p.username}</span>
              </div>
            ))}
          </div>
        )}
        <div className="w-full grid grid-cols-3 gap-3">
          {[
            { label: "Base Score", value: baseScore.toString(), color: "#f5f5f5" },
            { label: "Speed Bonus", value: "+" + speedBonus, color: "#f9ca24" },
            { label: "Puzzle Bonus", value: "+" + puzzleBonus, color: "#00b894" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-4 text-center" style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a" }}>
              <div className="font-chivo font-black text-[24px]" style={{ color: item.color }}>{item.value}</div>
              <div className="font-mono text-[10px] uppercase tracking-wider mt-1" style={{ color: "#888" }}>{item.label}</div>
            </div>
          ))}
        </div>
        {penalty > 0 && (
          <div className="w-full rounded-xl p-3 text-center" style={{ backgroundColor: "rgba(214,48,49,0.1)", border: "1px solid rgba(214,48,49,0.3)" }}>
            <span className="font-mono text-[12px]" style={{ color: "#d63031" }}>Penalti: -{penalty}</span>
          </div>
        )}
        <div className="text-center">
          <div className="font-chivo font-black" style={{ fontSize: "64px", color: "#f5f5f5", textShadow: "0 0 20px rgba(249,202,36,0.3)" }}>{totalScore.toLocaleString()}</div>
          <div className="font-mono text-[12px] uppercase tracking-wider" style={{ color: "#f9ca24" }}>+{xpEarned} XP</div>
          <div className="font-mono text-[11px] mt-1" style={{ color: "#888" }}>Diselesaikan dalam {formatDuration(durationSeconds)}</div>
        </div>
        {earnedBadges.length > 0 && (
          <div className="w-full">
            <div className="font-mono text-[11px] uppercase tracking-widest text-center mb-3" style={{ color: "#f9ca24" }}>BADGE DIPEROLEH</div>
            <div className="flex flex-col gap-3">
              {earnedBadges.map((badge, i) => (
                <div key={i} className="flex items-center gap-4 rounded-xl p-4" style={{ backgroundColor: "rgba(249,202,36,0.08)", border: "1px solid rgba(249,202,36,0.3)", boxShadow: "0 0 15px rgba(249,202,36,0.15)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-[18px]" style={{ backgroundColor: "rgba(249,202,36,0.2)", color: "#f9ca24" }}>{badge.icon || "*"}</div>
                  <div>
                    <div className="font-chivo font-bold text-[14px]" style={{ color: "#f9ca24" }}>{badge.name}</div>
                    <div className="font-franklin text-[12px]" style={{ color: "#888" }}>{badge.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3 w-full">
          <button onClick={onDashboard} className="flex-1 py-3 rounded-xl font-franklin font-bold text-[14px] uppercase tracking-wider transition-all" style={{ border: "1px solid #2a2a2a", color: "#888", backgroundColor: "transparent" }}>Dashboard</button>
          <button onClick={onPlayAgain} className="flex-1 py-3 rounded-xl font-franklin font-bold text-[14px] uppercase tracking-wider text-white transition-all" style={{ background: "linear-gradient(to right, #d63031, #0d0d0d)", boxShadow: "0 4px 15px rgba(214,48,49,0.2)" }}>Main Lagi</button>
        </div>
      </div>
    </div>
  )
}