'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeOptions {
  channelName: string
  table: string
  filter?: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  onchange: (payload: any) => void
}

export function useRealtime({
  channelName,
  table,
  filter,
  event = '*',
  onchange,
}: UseRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        { event, schema: 'public', table, filter },
        onchange
      )
      .subscribe()
    channelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelName, table, filter, event]) // intentionally omit onchange to avoid re-subs

  return channelRef
}