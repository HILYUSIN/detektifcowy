'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { DigitalFindings, AbilityId } from '@/types'
import WhatsAppViewer from './WhatsAppViewer'
import TelegramViewer from './TelegramViewer'
import GmailViewer from './GmailViewer'
import CallLogViewer from './CallLogViewer'
import AbilityLockedCard from '@/components/case/AbilityLockedCard'


type TabId = 'whatsapp' | 'telegram' | 'email' | 'calllog'

interface Tab {
  id: TabId
  label: string
}

interface TemuanDigitalPanelProps {
  findings: DigitalFindings | null | undefined
  playerAbilities: AbilityId[]
}

export default function TemuanDigitalPanel({
  findings,
  playerAbilities,
}: TemuanDigitalPanelProps) {
  // Gate: must have 'hacker' ability
  if (!playerAbilities.includes('hacker')) {
    return (
      <AbilityLockedCard requiredAbility="hacker" playerAbilities={playerAbilities} />
    )
  }

  const tabs: Tab[] = [
    ...(findings?.whatsapp_chats && findings.whatsapp_chats.length > 0
      ? [{ id: 'whatsapp' as TabId, label: 'WhatsApp' }]
      : []),
    ...(findings?.telegram_chats && findings.telegram_chats.length > 0
      ? [{ id: 'telegram' as TabId, label: 'Telegram' }]
      : []),
    ...(findings?.emails && findings.emails.length > 0
      ? [{ id: 'email' as TabId, label: 'Email' }]
      : []),
    ...(findings?.call_logs && findings.call_logs.length > 0
      ? [{ id: 'calllog' as TabId, label: 'Log Telepon' }]
      : []),
  ]

  const hasData = tabs.length > 0

  return (
    <TemuanDigitalPanelInner
      findings={findings}
      tabs={tabs}
      hasData={hasData}
    />
  )
}

// Inner component that can use hooks (parent is conditionally returned above)
function TemuanDigitalPanelInner({
  findings,
  tabs,
  hasData,
}: {
  findings: DigitalFindings | null | undefined
  tabs: { id: TabId; label: string }[]
  hasData: boolean
}) {
  const [activeTab, setActiveTab] = useState<TabId>(tabs[0]?.id ?? 'whatsapp')

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-48 text-[#888] text-[13px] font-franklin">
        Tidak ada temuan digital untuk kasus ini
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 max-h-[600px] overflow-hidden">
      {/* Tab selector */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-1.5 rounded-full text-[12px] font-franklin font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-[#d63031] text-white'
                : 'bg-[#201f1f] text-[#888] hover:text-[#e5e2e1] border border-[#2a2a2a]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Viewer area */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-xl">
        {activeTab === 'whatsapp' && findings?.whatsapp_chats && (
          <WhatsAppViewer
            messages={findings.whatsapp_chats}
            contactName="Kontak"
            contactAvatar={null}
          />
        )}
        {activeTab === 'telegram' && findings?.telegram_chats && (
          <TelegramViewer
            messages={findings.telegram_chats}
            contactName="Kontak"
          />
        )}
        {activeTab === 'email' && findings?.emails && (
          <GmailViewer emails={findings.emails} />
        )}
        {activeTab === 'calllog' && findings?.call_logs && (
          <CallLogViewer callLogs={findings.call_logs} />
        )}
      </div>
    </div>
  )
}
