'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getCases() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('cases')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getUsers() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, username, rank, is_blocked, total_xp')
    .order('total_xp', { ascending: false })
  return data ?? []
}

export async function blockUser(userId: string, reason?: string) {
  const supabase = await createClient()
  await supabase
    .from('profiles')
    .update({ is_blocked: true, blocked_reason: reason ?? null })
    .eq('id', userId)
  revalidatePath('/admin')
}

export async function unblockUser(userId: string) {
  const supabase = await createClient()
  await supabase
    .from('profiles')
    .update({ is_blocked: false, blocked_reason: null })
    .eq('id', userId)
  revalidatePath('/admin')
}

export async function deleteCase(caseId: string) {
  const supabase = await createClient()
  await supabase.from('cases').delete().eq('id', caseId)
  revalidatePath('/admin')
}

export async function publishCase(caseId: string) {
  const supabase = await createClient()
  await supabase.from('cases').update({ status: 'active' }).eq('id', caseId)
  revalidatePath('/admin')
}