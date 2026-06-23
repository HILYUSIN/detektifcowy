﻿﻿﻿﻿'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const DISCONNECT_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

export function useDisconnectGuard({
  roomId,
  userId,
  onTeamLost,
}: {
  roomId: string
  userId: string
  onTeamLost: (disconnectedUsername: string) => void
}) {
  const supabase = createClient()
  const disconnectTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Mark self as connected on mount, disconnected on unmount
  useEffect(() => {
    supabase
      .from('room_players')
      .update({ is_connected: true, disconnect_at: null })
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .then()

    // Heartbeat: update connected status every 30s
    const heartbeat = setInterval(() => {
      supabase
        .from('room_players')
        .update({ is_connected: true })
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .then()
    }, 30000)

    return () => {
      clearInterval(heartbeat)
      supabase
        .from('room_players')
        .update({ is_connected: false, disconnect_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .then()
    }
  }, [roomId, userId])

  // Watch for other players disconnecting
  useEffect(() => {
    const channel = supabase
      .channel("disconnect:" + roomId)
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room_players',
          filter: "room_id=eq." + roomId,
        },
        (payload: any) => {
          const player = payload.new
          if (player.user_id === userId) return // ignore self

          if (!player.is_connected && player.disconnect_at) {
            // Start 5-minute countdown
            if (!disconnectTimers.current[player.user_id]) {
              const username = player.username ?? 'Pemain'
              disconnectTimers.current[player.user_id] = setTimeout(() => {
                onTeamLost(username)
                delete disconnectTimers.current[player.user_id]
              }, DISCONNECT_TIMEOUT_MS)
            }
          } else if (player.is_connected) {
            // Player reconnected - clear timer
            if (disconnectTimers.current[player.user_id]) {
              clearTimeout(disconnectTimers.current[player.user_id])
              delete disconnectTimers.current[player.user_id]
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      Object.values(disconnectTimers.current).forEach(clearTimeout)
    }
  }, [roomId, userId])
}