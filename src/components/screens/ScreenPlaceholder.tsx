// Generic placeholder — used for Marketing, Sherloq System, Jira
// until real screens are built section by section

interface ScreenPlaceholderProps {
  title: string
  description: string
}

export function ScreenPlaceholder({ title, description }: ScreenPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center max-w-sm mx-auto"
      style={{ minHeight: 'calc(100vh - 52px)' }}>

      <div
        className="flex h-14 w-14 items-center justify-center rounded-[16px] text-on-accent text-xl font-bold"
        style={{ background: 'linear-gradient(135deg, var(--sherloq-primary), var(--sherloq-primary-hover))' }}
      >
        ✦
      </div>

      <div className="space-y-1">
        <p className="text-base font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </div>

      <span
        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
        style={{ backgroundColor: 'var(--signal-teal-bg)', color: 'var(--sherloq-primary)' }}
      >
        Kommt bald
      </span>
    </div>
  )
}
