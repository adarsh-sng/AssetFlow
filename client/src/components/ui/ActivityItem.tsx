interface ActivityItemProps {
  message: string
  timestamp: string
  highlight?: boolean
}

export function ActivityItem({ message, timestamp, highlight = false }: ActivityItemProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border-subtle last:border-b-0">
      <div className="flex items-start gap-3">
        <span
          className={`mt-1.5 block size-2 flex-shrink-0 ${
            highlight ? 'bg-accent' : 'bg-foreground/20'
          }`}
        />
        <span className="text-sm text-foreground/70">
          {message.split(/(AF-\d+)/).map((part, i) =>
            part.match(/AF-\d+/) ? (
              <strong key={i} className="font-bold text-foreground">
                {part}
              </strong>
            ) : (
              part
            )
          )}
        </span>
      </div>
      <span className="flex-shrink-0 text-2xs font-bold uppercase tracking-widest text-foreground/40">
        {timestamp}
      </span>
    </div>
  )
}
