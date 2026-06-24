'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getActiveCases() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('cases')
    .select('id, title, difficulty, description, thumbnail_url, region')
    .eq('status', 'active')
    .order('play_count', { ascending: false })
  return data ?? []
}

export async function assignCaseToRoom(roomId: string, caseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('rooms')
    .update({ case_id: caseId })
    .eq('id', roomId)
    .eq('host_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/room`)
  return { success: true }
}

export async function removeCaseFromRoom(roomId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('rooms')
    .update({ case_id: null })
    .eq('id', roomId)
    .eq('host_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/room`)
  return { success: true }
}

export async function saveAiConfig(config: object) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('ai_generator_config')
    .upsert({
      user_id: user.id,
      config: config,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) return { error: error.message }
  return { success: true }
}

export async function loadAiConfig() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('ai_generator_config')
    .select('config')
    .eq('user_id', user.id)
    .single()

  return data?.config ?? null
}

export async function getChatMessages(roomId: string, limit = 50) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('room_chat')
    .select('*, profiles(username)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(limit)
  return data ?? []
}

export async function sendChatMessage(roomId: string, message: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('room_chat')
    .insert({
      room_id: roomId,
      user_id: user.id,
      message: message.trim(),
    })

  if (error) return { error: error.message }
  return { success: true }
}
