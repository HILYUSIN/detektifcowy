// --- USER & AUTH --------------------------------------------------------------

export type Rank =
  | "cadet_investigator"
  | "field_detective"
  | "senior_detective"
  | "detective_sergeant"
  | "detective_lieutenant"
  | "chief_inspector"

export const RANK_LABELS: Record<Rank, string> = {
  cadet_investigator:    "Cadet Investigator",
  field_detective:       "Field Detective",
  senior_detective:      "Senior Detective",
  detective_sergeant:    "Detective Sergeant",
  detective_lieutenant:  "Detective Lieutenant",
  chief_inspector:       "Chief Inspector",
}

export const RANK_XP_THRESHOLDS: Record<Rank, number> = {
  cadet_investigator:    0,
  field_detective:       500,
  senior_detective:      1500,
  detective_sergeant:    3000,
  detective_lieutenant:  6000,
  chief_inspector:       10000,
}

export interface UserProfile {
  id: string
  username: string
  email: string
  bio: string | null
  rank: Rank
  total_xp: number
  created_at: string
}

// --- ABILITY ------------------------------------------------------------------

export type AbilityId =
  | "forensik"
  | "profiler"
  | "hacker"
  | "interogator"
  | "kriminolog"
  | "ahli_lapangan"
  | "jurnalis"
  | "pengacara"

export const ABILITY_LABELS: Record<AbilityId, string> = {
  forensik:      "Forensik",
  profiler:      "Profiler",
  hacker:        "Hacker / OSINT",
  interogator:   "Interogator",
  kriminolog:    "Kriminolog",
  ahli_lapangan: "Ahli Lapangan",
  jurnalis:      "Jurnalis",
  pengacara:     "Pengacara",
}

export const ABILITY_DESCRIPTIONS: Record<AbilityId, string> = {
  forensik:      "Akses visum, laporan lab, dan trace evidence",
  profiler:      "Akses profil psikologi dan pola perilaku tersangka",
  hacker:        "Akses chat HP, email, dan log digital korban",
  interogator:   "Ajukan pertanyaan lanjutan ke saksi dan tersangka",
  kriminolog:    "Akses SKCK dan riwayat kriminal tersangka",
  ahli_lapangan: "Akses foto TKP tambahan dan denah tersembunyi",
  jurnalis:      "Akses berita tersembunyi dan sumber informan",
  pengacara:     "Akses dokumen hukum dan celah alibi tersangka",
}

// --- CASE ---------------------------------------------------------------------

export type Difficulty = "easy" | "medium" | "hard" | "leader"
export type CaseStatus = "draft" | "active" | "inactive"

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy:   "Mudah",
  medium: "Menengah",
  hard:   "Sulit",
  leader: "Leader",
}

export interface Case {
  id: string
  title: string
  difficulty: Difficulty
  region: string
  description: string
  status: CaseStatus
  play_count: number
  like_count: number
  thumbnail_url: string | null
  content_json: CaseContent | null
  created_at: string
}

export interface CaseContent {
  victim: Victim
  suspects: Suspect[]
  witnesses: Witness[]
  clues: Clue[]
  maps: MapData
  digital_findings?: DigitalFindings
  forensic_docs?: ForensicDoc[]
  news_articles?: NewsArticle[]
  culprit_id: string
  solution_narrative: string
}

export interface Victim {
  name: string
  age: number
  occupation: string
  address: string
  date_of_incident: string
  description: string
  portrait_url: string | null
  scene_photos: string[]
  police_report: string
}

export interface Suspect {
  id: string
  name: string
  age: number
  occupation: string
  photo_url: string | null
  interrogation: string
  skck: string
  alibi: string
  other_docs: { title: string; content: string; required_ability?: AbilityId }[]
}

export interface Witness {
  id: string
  name: string
  relation: string
  photo_url: string | null
  initial_statement: string
}

export interface Clue {
  id: string
  title: string
  description: string
  image_url: string | null
  required_ability: AbilityId | null
  type: "physical" | "digital" | "testimonial" | "document"
}

export interface MapData {
  city_map_url: string | null
  scene_map_url: string | null
  scene_photos: { url: string; caption: string }[]
  location_markers: { label: string; description: string; x: number; y: number }[]
}

export interface DigitalFindings {
  whatsapp_chats?: ChatMessage[]
  telegram_chats?: ChatMessage[]
  emails?: Email[]
  call_logs?: CallLog[]
}

export interface ChatMessage {
  id: string
  sender: string
  content: string
  timestamp: string
  is_deleted: boolean
}

export interface Email {
  id: string
  from: string
  to: string
  subject: string
  body: string
  timestamp: string
  attachments: string[]
}

export interface CallLog {
  id: string
  contact: string
  number: string
  type: "incoming" | "outgoing" | "missed"
  duration: number
  timestamp: string
}

export interface ForensicDoc {
  title: string
  content: string
  required_ability: AbilityId | null
}

export interface NewsArticle {
  id: string
  publication: string
  journalist: string
  headline: string
  body: string
  published_at: string
}

// --- ROOM & GAME --------------------------------------------------------------

export type RoomSize = 2 | 3 | 4
export type RoomStatus = "waiting" | "in_progress" | "finished"

export interface Room {
  id: string
  room_code: string
  size: RoomSize
  status: RoomStatus
  case_id: string
  host_id: string
  created_at: string
}

export interface RoomPlayer {
  id: string
  room_id: string
  user_id: string
  username: string
  abilities: AbilityId[]
  score: number
  is_connected: boolean
  disconnect_at: string | null
}

// --- SCORING ------------------------------------------------------------------

export interface GameResult {
  room_id: string
  is_win: boolean
  culprit_id: string
  accused_id: string | null
  base_score: number
  speed_bonus: number
  puzzle_bonus: number
  penalty: number
  total_score: number
  xp_earned: number
  duration_seconds: number
  finished_at: string
}

// --- BADGE --------------------------------------------------------------------

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  condition_type: string
  condition_value: string
}

export interface UserBadge {
  user_id: string
  badge_id: string
  badge: Badge
  earned_at: string
}

// --- NOTEBOOK & BENANG MERAH --------------------------------------------------

export interface NotebookEntry {
  id: string
  room_id: string
  user_id: string
  type: "clue" | "quote" | "note" | "photo"
  title: string
  content: string
  source_id: string | null
  created_at: string
}

export interface BoardNode {
  id: string
  room_id: string
  type: "clue" | "suspect" | "witness" | "note"
  label: string
  x: number
  y: number
  source_id: string | null
}

export interface BoardConnection {
  id: string
  room_id: string
  from_node_id: string
  to_node_id: string
  label: string | null
}
