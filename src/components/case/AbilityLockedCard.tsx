import { Lock } from 'lucide-react'
import type { AbilityId } from '@/types'

// Import ABILITY_LABELS if available, otherwise fallback
const ABILITY_LABELS: Record<string, string> = {
  forensic: 'Forensik',
  hacker: 'Hacker',
  interrogator: 'Interogator',
  analyst: 'Analis',
  spy: 'Mata-mata',
}

interface AbilityLockedCardProps {
  requiredAbility: AbilityId
  playerAbilities: AbilityId[]
  children?: React.ReactNode
}

export default function AbilityLockedCard({
  requiredAbility,
  playerAbilities,
  children,
}: AbilityLockedCardProps) {
  const hasAbility = playerAbilities.includes(requiredAbility)

  if (hasAbility) {
    return <>{children}</>
  }

  const label = ABILITY_LABELS[requiredAbility] ?? requiredAbility

  return (
    <div
      className="bg-surface-container border border-border-gray rounded-xl p-6 text-center"
      role="region"
      aria-label="Konten terkunci"
    >
      <div className="flex justify-center mb-3">
        <Lock size={40} className="text-muted-gray/40" aria-hidden="true" />
      </div>
      <p className="font-mono text-xs text-muted-gray uppercase tracking-wider mb-2">
        Konten Terkunci
      </p>
      <p className="font-franklin text-sm text-muted-gray mb-3">
        Membutuhkan Ability:
      </p>
      <span className="inline-block bg-signature-red/10 text-signature-red border border-signature-red/30 font-mono text-xs uppercase tracking-wider px-3 py-1 rounded">
        {label}
      </span>
    </div>
  )
}