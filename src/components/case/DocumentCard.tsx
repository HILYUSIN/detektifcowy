import { cn } from '@/lib/utils'

interface DocumentCardProps {
  title: string
  subtitle?: string
  caseNumber?: string
  date?: string
  children: React.ReactNode
  showStamp?: boolean
  className?: string
}

export default function DocumentCard({
  title,
  subtitle,
  caseNumber,
  date,
  children,
  showStamp = true,
  className,
}: DocumentCardProps) {
  return (
    <div
      className={cn(
        'relative bg-paper-white border border-[#ccc] rounded shadow-md overflow-hidden',
        className
      )}
    >
      {/* Top binder strip */}
      <div className="bg-deep-black h-6 flex items-center px-4 gap-3">
        <div className="w-3 h-3 rounded-full bg-panel-gray border border-border-gray" />
        <div className="w-3 h-3 rounded-full bg-panel-gray border border-border-gray" />
      </div>

      {/* Document header */}
      <div className="px-6 pt-5 pb-3">
        <p className="font-chivo font-bold text-[11px] uppercase tracking-[0.2em] text-deep-black text-center">
          KEPOLISIAN NEGARA REPUBLIK INDONESIA
        </p>
        {subtitle && (
          <p className="font-mono text-[10px] text-deep-black/60 text-center mt-0.5">
            {subtitle}
          </p>
        )}
        <div className="border-t border-deep-black/20 my-3" />
        <div className="flex justify-between items-start">
          <div>
            <span className="font-mono text-[10px] text-deep-black/50 uppercase tracking-wider">Berkas</span>
            <p className="font-mono text-[11px] text-deep-black font-bold">{caseNumber ?? '—'}</p>
          </div>
          <div className="text-right">
            <span className="font-mono text-[10px] text-deep-black/50 uppercase tracking-wider">Tanggal</span>
            <p className="font-mono text-[11px] text-deep-black">{date ?? '—'}</p>
          </div>
        </div>
        <div className="border-t border-deep-black/20 mt-3" />
        <h2 className="font-chivo font-bold text-[14px] uppercase tracking-wider text-deep-black mt-3 text-center">
          {title}
        </h2>
      </div>

      {/* Content area */}
      <div className="font-serif text-[15px] text-deep-black leading-relaxed p-6 pt-0">
        {children}
      </div>

      {/* RAHASIA stamp */}
      {showStamp && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-8 -translate-y-1/2 rotate-[-15deg] border-4 border-signature-red text-signature-red font-chivo font-black text-[28px] uppercase tracking-widest opacity-25 mix-blend-multiply px-3 py-1 select-none"
        >
          RAHASIA
        </div>
      )}
    </div>
  )
}