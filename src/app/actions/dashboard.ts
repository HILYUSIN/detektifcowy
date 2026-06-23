"use server"

import { createClient } from "@/lib/supabase/server"
import { type Case } from "@/types"

export async function getTopCases(): Promise<Case[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("cases")
    .select("*")
    .eq("status", "active")
    .order("play_count", { ascending: false })
    .limit(10)
  return data ?? []
}

export async function getLeaderboard() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("id, username, rank, total_xp")
    .order("total_xp", { ascending: false })
    .limit(10)
  return data ?? []
}

export async function getGameHistory(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("game_results")
    .select("*, rooms(room_code, cases(title, difficulty))")
    .eq("rooms.room_players.user_id", userId)
    .order("finished_at", { ascending: false })
    .limit(20)
  return data ?? []
}