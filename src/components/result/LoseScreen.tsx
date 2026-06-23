"use client"

const LOSE_STYLES = [
  "@keyframes stampInRed {",
  "  0% { transform: rotate(12deg) scale(0); opacity: 0; }",
  "  80% { transform: rotate(12deg) scale(1.1); opacity: 1; }",
  "  100% { transform: rotate(12deg) scale(1); opacity: 1; }",
  "}",
  ".stamp-lose { animation: stampInRed 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }",
].join("\n")

interface LoseScreenProps {
  loseReason: "wrong_accusation" | "timeout" | "disconnect"
  accusedName?: string
  culpritName?: string
  disconnectedUsername?: string
  penalty: number
  xpEarned: number
  players: { userId: string; username: string; rank: string }[]
  currentUserId: string
  onTryAgain: () => void
  onDashboard: () => void
}

export default function LoseScreen({
  loseReason, accusedName, culpritName, disconnectedUsername,
  penalty, xpEarned, players, currentUserId, onTryAgain, onDashboard
}: LoseScreenProps) {
  const subtitle =
    loseReason === "wrong_accusation" ? "Pelaku masih berkeliaran bebas."
    : loseReason === "timeout" ? "Waktu habis. Pelaku lolos."
    : "Investigasi terhenti."

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden py-12 px-4" style={{ backgroundColor: "#0d0d0d" }}>
      <style dangerouslySetInnerHTML={{ __html: LOSE_STYLES }} />
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.03, mixBlendMode: "overlay" as const }} />
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-8">
        <div className="stamp-lose relative flex items-center justify-center w-44 h-44 rounded-full" style={{ border: "8px double #d63031", boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)" }}>
          <div className="absolute inset-3 rounded-full" style={{ border: "2px dashed rgba(214,48,49,0.4)" }} />
          <div className="font-chivo font-black uppercase text-center leading-tight" style={{ color: "#d63031", fontSize: "18px" }}>CASE<br />UNSOLVED</div>
        </div>
        <div className="text-center">
          <h1 className="font-chivo font-black uppercase" style={{ fontSize: "32px", color: "#f5f5f5", letterSpacing: "0.05em" }}>KASUS TIDAK TERSELESAIKAN</h1>
          <p className="font-serif italic mt-2" style={{ color: "#888", fontSize: "16px" }}>{subtitle}</p>
        </div>
        {loseReason === "wrong_accusation" && (accusedName || culpritName) && (
          <div className="w-full rounded-xl p-5" style={{ backgroundColor: "rgba(42,16,16,0.8)", borderLeft: "4px solid #d63031", border: "1px solid rgba(214,48,49,0.3)" }}>
            {accusedName && <div className="font-franklin text-[14px]" style={{ color: "#d63031" }}>Tuduhan Anda: {accusedName}</div>}
            {culpritName && <div className="font-franklin text-[13px] mt-1" style={{ color: "#888" }}>Pelaku asli: {culpritName}</div>}
          </div>
        )}
        {loseReason === "timeout" && (
          <div className="font-chivo font-black uppercase" style={{ fontSize: "40px", color: "#d63031" }}>WAKTU HABIS</div>
        )}
        {loseReason === "disconnect" && disconnectedUsername && (
          <div className="w-full rounded-xl p-5 text-center" style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a" }}>
            <p className="font-franklin text-[14px]" style={{ color: "#888" }}>{disconnectedUsername} meninggalkan permainan.</p>
          </div>
        )}
        <div className="text-center">
          <div className="font-chivo font-black" style={{ fontSize: "80px", color: "#888", lineHeight: "1" }}>0</div>
          <div className="font-mono text-[12px] uppercase tracking-wider mt-2" style={{ color: "#888" }}>+{xpEarned} XP (Partisipasi)</div>
        </div>
        <div className="w-full grid grid-cols-3 gap-3">
          {[
            { label: "Base Score", value: "0", color: "#888", highlight: false },
            { label: "Speed Bonus", value: "+0", color: "#888", highlight: false },
            { label: "Penalti", value: "-" + penalty, color: "#d63031", highlight: penalty > 0 },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-4 text-center" style={{ backgroundColor: "#1a1a1a", border: item.highlight ? "1px solid rgba(214,48,49,0.5)" : "1px solid #2a2a2a" }}>
              <div className="font-chivo font-black text-[24px]" style={{ color: item.color }}>{item.value}</div>
              <div className="font-mono text-[10px] uppercase tracking-wider mt-1" style={{ color: "#888" }}>{item.label}</div>
            </div>
          ))}
        </div>
        {players.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {players.map((p) => (
              <div key={p.userId} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-chivo font-black text-[18px]" style={{ backgroundColor: "#1a1a1a", border: "2px solid #2a2a2a", color: "#888", opacity: 0.6, filter: "grayscale(1)" }}>{p.username[0]?.toUpperCase()}</div>
                <span className="font-mono text-[10px]" style={{ color: "#888" }}>{p.username}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-3 w-full">
          <button onClick={onDashboard} className="flex-1 py-3 rounded-xl font-franklin font-bold text-[14px] uppercase tracking-wider transition-all" style={{ border: "1px solid #2a2a2a", color: "#888", backgroundColor: "transparent" }}>Dashboard</button>
          <button onClick={onTryAgain} className="flex-1 py-3 rounded-xl font-franklin font-bold text-[14px] uppercase tracking-wider transition-all" style={{ border: "1px solid #d63031", color: "#d63031", backgroundColor: "transparent" }}>Coba Lagi</button>
        </div>
      </div>
    </div>
  )
}