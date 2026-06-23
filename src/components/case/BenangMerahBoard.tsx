'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Plus, Link, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BoardNode, BoardConnection } from '@/types'

interface BenangMerahBoardProps {
  roomId: string
  initialNodes: BoardNode[]
  initialConnections: BoardConnection[]
  onClose: () => void
}

type NodeType = BoardNode['type']

const NODE_WIDTH = 144 // w-36
const NODE_HEIGHT = 72

const nodeTypeConfig: Record<NodeType, { label: string; borderClass: string; bgClass: string; textClass: string }> = {
  clue:    { label: 'Petunjuk',  borderClass: 'border-blue-500/50',   bgClass: 'bg-blue-500/10',   textClass: 'text-blue-400' },
  suspect: { label: 'Tersangka', borderClass: 'border-[#d63031]/50',  bgClass: 'bg-[#d63031]/10',  textClass: 'text-[#d63031]' },
  witness: { label: 'Saksi',     borderClass: 'border-purple-500/50', bgClass: 'bg-purple-500/10', textClass: 'text-purple-400' },
  note:    { label: 'Catatan',   borderClass: 'border-[#f9ca24]/50',  bgClass: 'bg-[#f9ca24]/10',  textClass: 'text-[#f9ca24]' },
}

const NOISE_SVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.04'/></svg>`

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function getNodeCenter(node: BoardNode): { x: number; y: number } {
  return {
    x: node.x + NODE_WIDTH / 2,
    y: node.y + NODE_HEIGHT / 2,
  }
}

export default function BenangMerahBoard({
  roomId,
  initialNodes,
  initialConnections,
  onClose,
}: BenangMerahBoardProps) {
  const [nodes, setNodes] = useState<BoardNode[]>(initialNodes)
  const [connections, setConnections] = useState<BoardConnection[]>(initialConnections)

  // Drag state
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Connect mode
  const [connectMode, setConnectMode] = useState(false)
  const [connectFrom, setConnectFrom] = useState<string | null>(null)
  const [connectionLabel, setConnectionLabel] = useState("")
  const [showLabelInput, setShowLabelInput] = useState(false)
  const [pendingConnectTo, setPendingConnectTo] = useState<string | null>(null)

  // Add node form
  const [showAddForm, setShowAddForm] = useState(false)
  const [newNodeLabel, setNewNodeLabel] = useState("")
  const [newNodeType, setNewNodeType] = useState<NodeType>('clue')

  const boardRef = useRef<HTMLDivElement>(null)

  // --- Drag handlers ---
  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      if (connectMode) return
      e.preventDefault()
      e.stopPropagation()
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) return
      const boardRect = boardRef.current?.getBoundingClientRect()
      if (!boardRect) return
      setDragging(nodeId)
      setDragOffset({
        x: e.clientX - boardRect.left - node.x,
        y: e.clientY - boardRect.top - node.y,
      })
    },
    [connectMode, nodes],
  )

  const handleBoardMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return
      const boardRect = boardRef.current?.getBoundingClientRect()
      if (!boardRect) return
      const newX = e.clientX - boardRect.left - dragOffset.x
      const newY = e.clientY - boardRect.top - dragOffset.y
      setNodes((prev) =>
        prev.map((n) =>
          n.id === dragging ? { ...n, x: Math.max(0, newX), y: Math.max(0, newY) } : n,
        ),
      )
    },
    [dragging, dragOffset],
  )

  const handleBoardMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  // Global mouseup in case cursor leaves board
  useEffect(() => {
    const handler = () => setDragging(null)
    window.addEventListener('mouseup', handler)
    return () => window.removeEventListener('mouseup', handler)
  }, [])

  // --- Connect handlers ---
  const handleNodeClick = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      if (!connectMode) return
      e.stopPropagation()

      if (!connectFrom) {
        setConnectFrom(nodeId)
        return
      }

      if (connectFrom === nodeId) {
        // deselect
        setConnectFrom(null)
        return
      }

      // Second node selected — ask for label
      setPendingConnectTo(nodeId)
      setShowLabelInput(true)
    },
    [connectMode, connectFrom],
  )

  const confirmConnection = useCallback(() => {
    if (!connectFrom || !pendingConnectTo) return
    const newConn: BoardConnection = {
      id: generateId(),
      room_id: roomId,
      from_node_id: connectFrom,
      to_node_id: pendingConnectTo,
      label: connectionLabel.trim() || null,
    }
    setConnections((prev) => [...prev, newConn])
    setConnectFrom(null)
    setPendingConnectTo(null)
    setConnectionLabel("")
    setShowLabelInput(false)
  }, [connectFrom, pendingConnectTo, connectionLabel, roomId])

  const cancelConnection = useCallback(() => {
    setConnectFrom(null)
    setPendingConnectTo(null)
    setConnectionLabel("")
    setShowLabelInput(false)
  }, [])

  // --- Add node ---
  const handleAddNode = useCallback(() => {
    if (!newNodeLabel.trim()) return
    const boardRect = boardRef.current?.getBoundingClientRect()
    const newNode: BoardNode = {
      id: generateId(),
      room_id: roomId,
      type: newNodeType,
      label: newNodeLabel.trim(),
      x: 60 + Math.random() * 200,
      y: 60 + Math.random() * 150,
      source_id: null,
    }
    setNodes((prev) => [...prev, newNode])
    setNewNodeLabel("")
    setShowAddForm(false)
  }, [newNodeLabel, newNodeType, roomId])

  // --- Delete all connections ---
  const handleDeleteConnections = useCallback(() => {
    setConnections([])
  }, [])

  // --- Toggle connect mode ---
  const toggleConnectMode = useCallback(() => {
    setConnectMode((prev) => !prev)
    setConnectFrom(null)
    setShowLabelInput(false)
    setPendingConnectTo(null)
  }, [])

  // Close add form on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddForm(false)
        cancelConnection()
        setConnectMode(false)
        setConnectFrom(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cancelConnection])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#0f0f0f]"
      style={{
        backgroundImage: `url("${NOISE_SVG}")`,
        backgroundRepeat: 'repeat',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#1a1a1a] border-b border-[#2a2a2a] shrink-0">
        <h1 className="font-chivo font-bold text-[15px] tracking-widest text-[#f5f5f5] uppercase">
          Benang Merah
        </h1>
        <span className="font-mono text-[11px] text-[#888] border border-[#2a2a2a] px-2 py-0.5 rounded">
          {roomId}
        </span>
        {/* Unsync badge */}
        <span className="font-mono text-[10px] text-[#f9ca24] border border-[#f9ca24]/30 bg-[#f9ca24]/5 px-2 py-0.5 rounded ml-1">
          LOKAL — Belum Tersinkron
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup papan"
          className="ml-auto text-[#888] hover:text-[#f5f5f5] transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border-b border-[#2a2a2a] shrink-0 flex-wrap">
        {/* Add node button */}
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#201f1f] border border-[#2a2a2a] rounded-lg text-[12px] font-franklin text-[#e5e2e1] hover:bg-[#2a2a2a] transition-colors"
        >
          <Plus size={13} />
          Tambah Node
        </button>

        {/* Connect mode toggle */}
        <button
          type="button"
          onClick={toggleConnectMode}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-[12px] font-franklin transition-colors',
            connectMode
              ? 'bg-[#d63031] border-[#d63031] text-white'
              : 'bg-[#201f1f] border-[#2a2a2a] text-[#e5e2e1] hover:bg-[#2a2a2a]',
          )}
        >
          <Link size={13} />
          {connectMode ? 'Hubungkan: Aktif' : 'Hubungkan'}
        </button>

        {/* Delete connections */}
        {connections.length > 0 && (
          <button
            type="button"
            onClick={handleDeleteConnections}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#201f1f] border border-[#2a2a2a] rounded-lg text-[12px] font-franklin text-[#d63031] hover:bg-[#2a2a2a] transition-colors"
          >
            <Trash2 size={13} />
            Hapus Koneksi
          </button>
        )}

        {/* Connect mode hint */}
        {connectMode && (
          <span className="font-mono text-[11px] text-[#888] ml-2">
            {connectFrom
              ? 'Klik node kedua untuk menghubungkan...'
              : 'Klik node pertama...'}
          </span>
        )}
      </div>

      {/* Board area */}
      <div
        ref={boardRef}
        className="flex-1 relative overflow-hidden"
        onMouseMove={handleBoardMouseMove}
        onMouseUp={handleBoardMouseUp}
        style={{ cursor: dragging ? 'grabbing' : 'default' }}
      >
        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-chivo text-[14px] text-[#555] text-center">
              Tambahkan node untuk mulai menghubungkan petunjuk
            </p>
          </div>
        )}

        {/* SVG connection layer */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {connections.map((conn) => {
            const fromNode = nodes.find((n) => n.id === conn.from_node_id)
            const toNode = nodes.find((n) => n.id === conn.to_node_id)
            if (!fromNode || !toNode) return null
            const from = getNodeCenter(fromNode)
            const to = getNodeCenter(toNode)
            const midX = (from.x + to.x) / 2
            const midY = (from.y + to.y) / 2
            return (
              <g key={conn.id}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#d63031"
                  strokeWidth="2"
                  strokeDasharray="6 3"
                  opacity="0.8"
                />
                {conn.label && (
                  <text
                    x={midX}
                    y={midY - 6}
                    fill="#d63031"
                    fontSize="11"
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="middle"
                    dominantBaseline="auto"
                  >
                    {conn.label}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* Node cards */}
        {nodes.map((node) => {
          const config = nodeTypeConfig[node.type]
          const isConnectSource = connectFrom === node.id

          return (
            <div
              key={node.id}
              className={cn(
                'absolute bg-[#1a1a1a] border rounded-xl p-3 w-36 select-none',
                'transition-shadow',
                config.borderClass,
                isConnectSource && 'border-[#d63031] shadow-[0_0_12px_2px_rgba(214,48,49,0.4)]',
                connectMode ? 'cursor-pointer' : 'cursor-grab',
                dragging === node.id && 'cursor-grabbing shadow-lg opacity-90',
              )}
              style={{ left: node.x, top: node.y, zIndex: dragging === node.id ? 20 : 10 }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onClick={(e) => handleNodeClick(e, node.id)}
            >
              {/* Type pill */}
              <div className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium mb-1.5', config.bgClass, config.textClass)}>
                {config.label}
              </div>
              {/* Label */}
              <p className="font-chivo font-bold text-[13px] text-[#f5f5f5] leading-snug line-clamp-3">
                {node.label}
              </p>
            </div>
          )
        })}
      </div>

      {/* Add node modal */}
      {showAddForm && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60"
          onClick={() => setShowAddForm(false)}
        >
          <div
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 w-72 flex flex-col gap-3 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-chivo font-bold text-[14px] text-[#f5f5f5]">Tambah Node Baru</h3>

            <input
              type="text"
              placeholder="Label node..."
              value={newNodeLabel}
              onChange={(e) => setNewNodeLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNode()}
              autoFocus
              className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] font-franklin text-[#f5f5f5] placeholder-[#555] focus:outline-none focus:border-[#d63031] transition-colors"
            />

            {/* Type selector */}
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(nodeTypeConfig) as NodeType[]).map((type) => {
                const cfg = nodeTypeConfig[type]
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewNodeType(type)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border transition-colors',
                      newNodeType === type
                        ? cn(cfg.bgClass, cfg.textClass, cfg.borderClass)
                        : 'bg-transparent border-[#2a2a2a] text-[#888] hover:border-[#444]',
                    )}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-[12px] font-franklin text-[#888] hover:text-[#f5f5f5] transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAddNode}
                disabled={!newNodeLabel.trim()}
                className="px-4 py-1.5 bg-[#d63031] text-white text-[12px] font-franklin rounded-lg disabled:opacity-40 hover:bg-[#c0392b] transition-colors"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection label input modal */}
      {showLabelInput && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60"
          onClick={cancelConnection}
        >
          <div
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 w-72 flex flex-col gap-3 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-chivo font-bold text-[14px] text-[#f5f5f5]">Label Koneksi</h3>
            <p className="font-mono text-[11px] text-[#888]">
              Opsional — kosongkan jika tidak diperlukan
            </p>

            <input
              type="text"
              placeholder="Contoh: alibi, motif..."
              value={connectionLabel}
              onChange={(e) => setConnectionLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmConnection()}
              autoFocus
              className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[13px] font-franklin text-[#f5f5f5] placeholder-[#555] focus:outline-none focus:border-[#d63031] transition-colors"
            />

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={cancelConnection}
                className="px-3 py-1.5 text-[12px] font-franklin text-[#888] hover:text-[#f5f5f5] transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmConnection}
                className="px-4 py-1.5 bg-[#d63031] text-white text-[12px] font-franklin rounded-lg hover:bg-[#c0392b] transition-colors"
              >
                Hubungkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
