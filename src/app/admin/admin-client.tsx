"use client"

import { useState, useEffect, useRef } from "react"
import { getCases, getUsers, blockUser, unblockUser, deleteCase, publishCase, saveDraftCase } from "./actions"

type MenuKey = "dashboard" | "cases" | "ai-generator" | "users" | "settings"
interface LogEntry { time: string; level: "info"|"success"|"warning"|"error"; message: string }
interface Props { profile: any; totalCases: number; totalUsers: number }

function ts(): string { return new Date().toLocaleTimeString("id-ID", { hour12: false }) }
const LC: Record<string, string> = { info:"#888", success:"#00b894", warning:"#fdcb6e", error:"#d63031" }
const DC: Record<string, string> = { easy:"#00b894", medium:"#fdcb6e", hard:"#d63031", leader:"#d63031" }
const DL: Record<string, string> = { easy:"Mudah", medium:"Sedang", hard:"Sulit", leader:"Leader" }
const SC: Record<string, string> = { active:"#00b894", draft:"#fdcb6e", inactive:"#888" }
const RL: Record<string, string> = { cadet_investigator:"Cadet", field_detective:"Field Det.", senior_detective:"Senior Det.", detective_sergeant:"Det. Sgt", detective_lieutenant:"Det. Lt", chief_inspector:"Chief Insp." }
const MENU: {key:MenuKey;label:string}[] = [
  {key:"dashboard",label:"Dashboard Admin"},{key:"cases",label:"Kelola Case"},
  {key:"ai-generator",label:"AI Generator"},{key:"users",label:"Kelola User"},{key:"settings",label:"Pengaturan"}
]

export default function AdminClient({ profile, totalCases, totalUsers }: Props) {
  const [menu, setMenu] = useState<MenuKey>("dashboard")
  const [logs, setLogs] = useState<LogEntry[]>([
    { time: ts(), level: "success", message: "Admin panel initialized." },
    { time: ts(), level: "info", message: "Logged in as " + (profile?.username ?? "admin") },
  ])
  const [cases, setCases] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [cmd, setCmd] = useState("")
  const [models, setModels] = useState([
    { slot:"AI 1", fungsi:"Narasi & Konten",  provider:"OpenAI", baseUrl:"https://api.openai.com/v1",        model:"gpt-4o",      apiKey:"" },
    { slot:"AI 2", fungsi:"QC Gambar",         provider:"OpenAI", baseUrl:"https://api.openai.com/v1",        model:"gpt-4o-mini", apiKey:"" },
    { slot:"AI 3", fungsi:"Generate Gambar",   provider:"OpenAI", baseUrl:"https://api.openai.com/v1",        model:"dall-e-3",    apiKey:"" },
  ])
  const [cfg, setCfg] = useState({ difficulty:"medium", region:"", premis:"" })
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState<any>(null)
  const consoleEnd = useRef<HTMLDivElement>(null)
  const addLog = (level: LogEntry["level"], message: string) => setLogs((p) => [...p, { time: ts(), level, message }])

  useEffect(() => { consoleEnd.current?.scrollIntoView({ behavior: "smooth" }) }, [logs])

  const switchMenu = async (key: MenuKey) => {
    setMenu(key); addLog("info", "Navigating to: " + key)
    if (key === "cases" && cases.length === 0) { const d = await getCases(); setCases(d); addLog("success", "Loaded " + d.length + " cases.") }
    if (key === "users" && users.length === 0) { const d = await getUsers(); setUsers(d); addLog("success", "Loaded " + d.length + " users.") }
  }

  const handleCmd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cmd.trim()) return
    const c = cmd.toLowerCase().trim()
    addLog("info", "> " + cmd)
    if (c === "clear" || c === "cls") setLogs([])
    else if (c === "help") addLog("info", "Commands: clear, help, status")
    else if (c === "status") addLog("success", "Online. Cases: " + totalCases + " Users: " + totalUsers)
    else addLog("warning", "Unknown: " + cmd)
    setCmd("")
  }

  const handlePublish = async (id: string, title: string) => {
    await publishCase(id); addLog("success", "Published: " + title)
    setCases(await getCases())
  }
  const handleDelete = async (id: string, title: string) => {
    if (!confirm("Hapus case ini?")) return
    await deleteCase(id); addLog("error", "Deleted: " + title)
    setCases(await getCases())
  }
  const handleToggleBlock = async (id: string, isBlocked: boolean, username: string) => {
    if (isBlocked) { await unblockUser(id); addLog("success", "Unblocked: " + username) }
    else { await blockUser(id); addLog("warning", "Blocked: " + username) }
    setUsers(await getUsers())
  }
  const handleGenerate = async () => {
    setGenerating(true)
    addLog("info", "Generating case...")
    const title = "Misteri di " + (cfg.region || "Kota Tak Bernama")
    const description = cfg.premis || "Kasus misterius menanti penyelidikan lebih lanjut."
    const result = await saveDraftCase({
      title,
      difficulty: cfg.difficulty,
      region: cfg.region || "Jakarta",
      description,
    })
    setGenerating(false)
    if (result.error) {
      addLog("error", "Gagal simpan: " + result.error)
      return
    }
    setGenerated({ id: result.id, title, difficulty: cfg.difficulty, synopsis: description, status: "draft" })
    addLog("success", "Case tersimpan sebagai draft: " + title)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#0d0d0d" }}>
      <style dangerouslySetInnerHTML={{ __html: "@keyframes cpulse{0%,100%{opacity:1}50%{opacity:0.2}}.cpulse{animation:cpulse 1.2s infinite}" }} />

      <aside className="flex flex-col shrink-0" style={{ width:"220px", backgroundColor:"#111", borderRight:"1px solid #2a2a2a" }}>
        <div className="p-5" style={{ borderBottom:"1px solid #2a2a2a" }}>
          <div className="font-chivo font-black text-[13px] uppercase tracking-widest" style={{ color:"#d63031" }}>HQ COMMAND</div>
          <div className="font-mono text-[10px] mt-0.5" style={{ color:"#888" }}>Admin Access Only</div>
        </div>
        <nav className="flex-1 py-3">
          {MENU.map((item) => (
            <button key={item.key} onClick={() => switchMenu(item.key)} className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors" style={{ borderLeft: menu===item.key ? "4px solid #d63031" : "4px solid transparent", backgroundColor: menu===item.key ? "#201f1f" : "transparent", color: menu===item.key ? "#d63031" : "#888" }}>
              <span className="font-franklin text-[13px]">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4" style={{ borderTop:"1px solid #2a2a2a" }}>
          <div className="font-mono text-[10px] mb-3" style={{ color:"#888" }}>{profile?.username ?? "admin"}</div>
          <a href="/dashboard" className="block w-full text-center font-chivo font-bold text-[12px] uppercase tracking-wider text-white py-2 rounded-lg" style={{ background:"linear-gradient(to right, #d63031, #0d0d0d)" }}>DISCONNECT</a>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        {menu === "dashboard" && (
          <div>
            <h2 className="font-chivo font-black text-[22px] uppercase mb-6" style={{ color:"#f5f5f5" }}>Dashboard Admin</h2>
            <div className="grid grid-cols-3 gap-4">
              {[{label:"Total Case",value:totalCases,color:"#f9ca24"},{label:"Total User",value:totalUsers,color:"#00b894"},{label:"Game Aktif",value:"--",color:"#888"}].map((s) => (
                <div key={s.label} className="rounded-xl p-6" style={{ backgroundColor:"#1a1a1a", border:"1px solid #2a2a2a" }}>
                  <div className="font-chivo font-black text-[40px]" style={{ color:s.color }}>{s.value}</div>
                  <div className="font-mono text-[11px] uppercase tracking-wider mt-1" style={{ color:"#888" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {menu === "cases" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-chivo font-black text-[22px] uppercase" style={{ color:"#f5f5f5" }}>Kelola Case</h2>
              <button className="font-chivo font-bold text-[12px] uppercase tracking-wider text-white px-5 py-2 rounded-lg" style={{ background:"linear-gradient(to right, #d63031, #0d0d0d)" }} onClick={() => addLog("info", "Add case form coming soon")}>+ Tambah Case</button>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ border:"1px solid #2a2a2a" }}>
              <table className="w-full">
                <thead><tr style={{ backgroundColor:"#1a1a1a", borderBottom:"1px solid #2a2a2a" }}>{["#","Judul","Difficulty","Status","Aksi"].map((h)=><th key={h} className="font-mono text-[10px] uppercase tracking-wider text-left px-4 py-3" style={{ color:"#888" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {cases.length===0 ? <tr><td colSpan={5} className="px-4 py-8 text-center font-mono text-[12px]" style={{ color:"#888" }}>Belum ada case.</td></tr>
                  : cases.map((c,i)=>(
                    <tr key={c.id} style={{ borderBottom:"1px solid #1a1a1a" }}>
                      <td className="px-4 py-3 font-mono text-[11px]" style={{ color:"#888" }}>{i+1}</td>
                      <td className="px-4 py-3 font-franklin text-[13px]" style={{ color:"#f5f5f5" }}>{c.title??"--"}</td>
                      <td className="px-4 py-3"><span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded" style={{ color:DC[c.difficulty]??"#888", backgroundColor:(DC[c.difficulty]??"#888")+"20" }}>{DL[c.difficulty]??c.difficulty}</span></td>
                      <td className="px-4 py-3"><span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded" style={{ color:SC[c.status]??"#888", backgroundColor:(SC[c.status]??"#888")+"20" }}>{c.status??"draft"}</span></td>
                      <td className="px-4 py-3"><div className="flex gap-2">
                        {c.status!=="active" && <button className="font-mono text-[10px] uppercase px-2 py-1 rounded" style={{ color:"#00b894", border:"1px solid rgba(0,184,148,0.3)" }} onClick={()=>handlePublish(c.id,c.title)}>Publish</button>}
                        <button className="font-mono text-[10px] uppercase px-2 py-1 rounded" style={{ color:"#d63031", border:"1px solid rgba(214,48,49,0.3)" }} onClick={()=>handleDelete(c.id,c.title)}>Hapus</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {menu === "ai-generator" && (
          <div className="flex flex-col gap-6">
            <h2 className="font-chivo font-black text-[22px] uppercase" style={{ color:"#f5f5f5" }}>AI Generator</h2>

            {/* Per-slot AI config cards */}
            {models.map((row, idx) => (
              <div key={idx} className="rounded-xl overflow-hidden" style={{ border:"1px solid #2a2a2a" }}>
                {/* Card header */}
                <div className="px-5 py-3 flex items-center gap-3" style={{ backgroundColor:"#1a1a1a", borderBottom:"1px solid #2a2a2a" }}>
                  <span className="font-chivo font-black text-[13px] uppercase px-2 py-0.5 rounded" style={{ backgroundColor:"rgba(214,48,49,0.15)", color:"#d63031", border:"1px solid rgba(214,48,49,0.3)" }}>{row.slot}</span>
                  <span className="font-chivo font-bold text-[14px] uppercase" style={{ color:"#f5f5f5" }}>{row.fungsi}</span>
                </div>
                {/* Fields grid */}
                <div className="p-5 grid grid-cols-2 gap-4" style={{ backgroundColor:"#161616" }}>
                  {/* Provider */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-wider" style={{ color:"#888" }}>Provider</label>
                    <select
                      value={row.provider}
                      onChange={(e)=>{const u=[...models];u[idx]={...u[idx],provider:e.target.value};setModels(u)}}
                      className="rounded-lg px-3 py-2 font-mono text-[12px] outline-none"
                      style={{ backgroundColor:"#201f1f", border:"1px solid #2a2a2a", color:"#f5f5f5" }}
                    >
                      <option>OpenAI</option>
                      <option>Anthropic</option>
                      <option>Google</option>
                      <option>Custom</option>
                    </select>
                  </div>
                  {/* Base URL */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-wider" style={{ color:"#888" }}>Base URL</label>
                    <input
                      value={row.baseUrl}
                      onChange={(e)=>{const u=[...models];u[idx]={...u[idx],baseUrl:e.target.value};setModels(u)}}
                      placeholder="https://api.openai.com/v1"
                      className="rounded-lg px-3 py-2 font-mono text-[12px] outline-none"
                      style={{ backgroundColor:"#201f1f", border:"1px solid #2a2a2a", color:"#f5f5f5" }}
                    />
                  </div>
                  {/* Model */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-wider" style={{ color:"#888" }}>Model</label>
                    <input
                      value={row.model}
                      onChange={(e)=>{const u=[...models];u[idx]={...u[idx],model:e.target.value};setModels(u)}}
                      placeholder="gpt-4o"
                      className="rounded-lg px-3 py-2 font-mono text-[12px] outline-none"
                      style={{ backgroundColor:"#201f1f", border:"1px solid #2a2a2a", color:"#f5f5f5" }}
                    />
                  </div>
                  {/* API Key */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-wider" style={{ color:"#888" }}>API Key</label>
                    <input
                      type="password"
                      value={row.apiKey}
                      onChange={(e)=>{const u=[...models];u[idx]={...u[idx],apiKey:e.target.value};setModels(u)}}
                      placeholder="sk-..."
                      className="rounded-lg px-3 py-2 font-mono text-[12px] outline-none"
                      style={{ backgroundColor:"#201f1f", border:"1px solid #2a2a2a", color:"#f5f5f5" }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="rounded-xl p-6 flex flex-col gap-4" style={{ backgroundColor:"#1a1a1a", border:"1px solid #2a2a2a" }}>
              <div className="font-chivo font-bold text-[14px] uppercase" style={{ color:"#f5f5f5" }}>Case Config</div>
              <div className="flex gap-3">{["easy","medium","hard","leader"].map((d)=>(<button key={d} onClick={()=>setCfg((p)=>({...p,difficulty:d}))} className="px-4 py-2 rounded-lg font-mono text-[11px] uppercase tracking-wider" style={{ border:"1px solid "+(cfg.difficulty===d?DC[d]:"#2a2a2a"), color:cfg.difficulty===d?DC[d]:"#888", backgroundColor:cfg.difficulty===d?DC[d]+"15":"transparent" }}>{DL[d]}</button>))}</div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] uppercase tracking-wider" style={{ color:"#888" }}>Region / Setting</label>
                <input value={cfg.region} onChange={(e)=>setCfg((p)=>({...p,region:e.target.value}))} placeholder="Contoh: Jakarta 1990..." className="rounded-lg px-3 py-2 font-franklin text-[13px] outline-none" style={{ backgroundColor:"#201f1f", border:"1px solid #2a2a2a", color:"#f5f5f5" }} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] uppercase tracking-wider" style={{ color:"#888" }}>Premis (opsional)</label>
                <textarea value={cfg.premis} onChange={(e)=>setCfg((p)=>({...p,premis:e.target.value}))} rows={3} placeholder="Kosongkan untuk AI tentukan sendiri..." className="rounded-lg px-3 py-2 font-franklin text-[13px] outline-none resize-none" style={{ backgroundColor:"#201f1f", border:"1px solid #2a2a2a", color:"#f5f5f5" }} />
              </div>
              <button onClick={handleGenerate} disabled={generating} className="self-start font-chivo font-bold text-[13px] uppercase tracking-wider text-white px-8 py-3 rounded-xl flex items-center gap-2" style={{ background:"linear-gradient(to right, #d63031, #0d0d0d)", opacity:generating?0.6:1 }}>
                {generating && <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin inline-block" style={{ borderColor:"rgba(255,255,255,0.3)", borderTopColor:"white" }} />}
                {generating ? "GENERATING..." : "GENERATE CASE"}
              </button>
            </div>
            {generated && (
              <div className="rounded-xl p-6" style={{ backgroundColor:"#201f1f", border:"1px solid rgba(249,202,36,0.3)" }}>
                <div className="font-chivo font-bold text-[14px] uppercase mb-2" style={{ color:"#f9ca24" }}>Hasil Generate</div>
                <p className="font-chivo font-bold text-[18px] mb-1" style={{ color:"#f5f5f5" }}>{generated.title}</p>
                <p className="font-mono text-[11px] mb-4" style={{ color:"#888" }}>{DL[generated.difficulty]} - {generated.synopsis}</p>
                <div className="flex gap-3">
                  <button onClick={async()=>{
                    await publishCase(generated.id)
                    addLog("success","Published: "+generated.title)
                    setCases(await getCases())
                    setGenerated(null)
                  }} className="font-mono text-[11px] uppercase px-4 py-2 rounded-lg" style={{ backgroundColor:"rgba(0,184,148,0.15)", border:"1px solid #00b894", color:"#00b894" }}>Publish</button>
                  <button onClick={()=>setGenerated(null)} className="font-mono text-[11px] uppercase px-4 py-2 rounded-lg" style={{ backgroundColor:"transparent", border:"1px solid #2a2a2a", color:"#888" }}>Generate Ulang</button>
                </div>
              </div>
            )}
          </div>
        )}

        {menu === "users" && (
          <div>
            <h2 className="font-chivo font-black text-[22px] uppercase mb-6" style={{ color:"#f5f5f5" }}>Kelola User</h2>
            <div className="rounded-xl overflow-hidden" style={{ border:"1px solid #2a2a2a" }}>
              <table className="w-full">
                <thead><tr style={{ backgroundColor:"#1a1a1a", borderBottom:"1px solid #2a2a2a" }}>{["Avatar","Username","Rank","Status","Aksi"].map((h)=><th key={h} className="font-mono text-[10px] uppercase tracking-wider text-left px-4 py-3" style={{ color:"#888" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {users.length===0 ? <tr><td colSpan={5} className="px-4 py-8 text-center font-mono text-[12px]" style={{ color:"#888" }}>Belum ada user.</td></tr>
                  : users.map((u)=>(
                    <tr key={u.id} style={{ borderBottom:"1px solid #1a1a1a" }}>
                      <td className="px-4 py-3"><div className="w-8 h-8 rounded-full flex items-center justify-center font-chivo font-bold text-[13px]" style={{ backgroundColor:"#2a2a2a", color:"#f5f5f5" }}>{u.username?.[0]?.toUpperCase()}</div></td>
                      <td className="px-4 py-3 font-franklin text-[13px]" style={{ color:"#f5f5f5" }}>{u.username}</td>
                      <td className="px-4 py-3"><span className="font-mono text-[10px] uppercase" style={{ color:"#888" }}>{RL[u.rank]??u.rank}</span></td>
                      <td className="px-4 py-3"><span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded" style={{ color:u.is_blocked?"#d63031":"#00b894", backgroundColor:u.is_blocked?"rgba(214,48,49,0.1)":"rgba(0,184,148,0.1)" }}>{u.is_blocked?"Diblokir":"Aktif"}</span></td>
                      <td className="px-4 py-3"><button className="font-mono text-[10px] uppercase px-3 py-1 rounded" style={{ color:u.is_blocked?"#00b894":"#d63031", border:"1px solid "+(u.is_blocked?"rgba(0,184,148,0.3)":"rgba(214,48,49,0.3)") }} onClick={()=>handleToggleBlock(u.id,u.is_blocked,u.username)}>{u.is_blocked?"Unblok":"Blokir"}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {menu === "settings" && (
          <div className="max-w-md">
            <h2 className="font-chivo font-black text-[22px] uppercase mb-6" style={{ color:"#f5f5f5" }}>Pengaturan</h2>
            <div className="rounded-xl p-6 flex flex-col gap-4" style={{ backgroundColor:"#1a1a1a", border:"1px solid #2a2a2a" }}>
              <div className="font-chivo font-bold text-[14px] uppercase" style={{ color:"#f5f5f5" }}>Ganti Password</div>
              <input type="password" placeholder="Password baru" className="rounded-lg px-3 py-2 font-franklin text-[13px] outline-none" style={{ backgroundColor:"#201f1f", border:"1px solid #2a2a2a", color:"#f5f5f5" }} />
              <button className="self-start font-chivo font-bold text-[12px] uppercase tracking-wider text-white px-6 py-2.5 rounded-lg" style={{ background:"linear-gradient(to right, #d63031, #0d0d0d)" }} onClick={()=>addLog("info","Password update - connect to Supabase auth")}>Simpan</button>
            </div>
          </div>
        )}
      </main>

      <aside className="flex flex-col shrink-0" style={{ width:"280px", backgroundColor:"#0a0a0a", borderLeft:"1px solid #2a2a2a" }}>
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom:"1px solid #2a2a2a" }}>
          <div className="w-2 h-2 rounded-full cpulse" style={{ backgroundColor:"#d63031" }} />
          <span className="font-mono text-[11px] uppercase tracking-wider" style={{ color:"#888" }}>CONSOLE LOG</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1" style={{ fontSize:"11px" }}>
          {logs.map((entry, i) => (
            <div key={i} className="font-mono leading-relaxed break-all">
              <span style={{ color:"#555" }}>[{entry.time}] </span>
              <span style={{ color:LC[entry.level] }}>{entry.message}</span>
            </div>
          ))}
          <div ref={consoleEnd} />
        </div>
        <div className="p-3" style={{ borderTop:"1px solid #2a2a2a" }}>
          <button onClick={()=>setLogs([])} className="w-full font-mono text-[10px] uppercase tracking-wider py-1.5 rounded mb-2 transition-colors" style={{ border:"1px solid #2a2a2a", color:"#888", backgroundColor:"transparent" }}>Hapus Log</button>
          <form onSubmit={handleCmd} className="flex items-center gap-1">
            <span className="font-mono text-[12px] font-bold shrink-0" style={{ color:"#d63031" }}>{'>'}</span>
            <input value={cmd} onChange={(e)=>setCmd(e.target.value)} placeholder="command..." className="flex-1 bg-transparent font-mono text-[11px] outline-none" style={{ color:"#f5f5f5" }} />
          </form>
        </div>
      </aside>
    </div>
  )
}