﻿﻿﻿'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useVoiceChat(roomId: string, userId: string) {
  const [isMuted, setIsMuted] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set())
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({})
  const supabase = createClient()

  const signalingChannel = "voice:" + roomId

  const createPeerConnection = useCallback(
    (targetUserId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      })

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          supabase.channel(signalingChannel).send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: {
              from: userId,
              to: targetUserId,
              candidate: event.candidate,
            },
          })
        }
      }

      pc.ontrack = (event) => {
        const audio = new Audio()
        audio.srcObject = event.streams[0]
        audio.play().catch(() => {})
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!)
        })
      }

      return pc
    },
    [userId, signalingChannel]
  )

  const startVoice = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream
      // Start muted by default
      stream.getAudioTracks().forEach((t) => {
        t.enabled = false
      })
      setIsConnected(true)
    } catch (err) {
      console.error('Voice chat error:', err)
    }
  }, [])

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return
    const tracks = localStreamRef.current.getAudioTracks()
    const newMuted = !isMuted
    tracks.forEach((t) => {
      t.enabled = newMuted
    })
    setIsMuted(!newMuted)
  }, [isMuted])

  const stopVoice = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    Object.values(peerConnectionsRef.current).forEach((pc) => pc.close())
    peerConnectionsRef.current = {}
    setIsConnected(false)
    setIsMuted(true)
  }, [])

  // Signaling via Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel(signalingChannel)
      .on('broadcast', { event: 'offer' }, async ({ payload }: any) => {
        if (payload.to !== userId) return
        const pc = createPeerConnection(payload.from)
        peerConnectionsRef.current[payload.from] = pc
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        channel.send({
          type: 'broadcast',
          event: 'answer',
          payload: { from: userId, to: payload.from, answer },
        })
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }: any) => {
        if (payload.to !== userId) return
        const pc = peerConnectionsRef.current[payload.from]
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(payload.answer))
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }: any) => {
        if (payload.to !== userId) return
        const pc = peerConnectionsRef.current[payload.from]
        if (pc) await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, userId, createPeerConnection, signalingChannel])

  useEffect(() => {
    return () => {
      stopVoice()
    }
  }, [])

  return { isMuted, isConnected, speakingUsers, startVoice, toggleMute, stopVoice }
}