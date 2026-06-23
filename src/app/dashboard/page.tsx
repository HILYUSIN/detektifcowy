import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardClient from "./dashboard-client"
import { getTopCases, getLeaderboard } from "@/app/actions/dashboard"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  const [cases, leaderboard] = await Promise.all([
    getTopCases(),
    getLeaderboard(),
  ])

  return (
    <DashboardClient
      profile={profile}
      cases={cases}
      leaderboard={leaderboard}
      currentUserId={user.id}
    />
  )
}