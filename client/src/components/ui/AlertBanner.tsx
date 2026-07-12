import { AlertTriangle } from 'lucide-react'

interface AlertBannerProps {
  message: string
  action?: { label: string; onClick: () => void }
}

export function AlertBanner({ message, action }: AlertBannerProps) {
  return (
    <div className="flex items-center justify-between gap-4 bg-accent px-6 py-4 text-background border border-foreground">
      <div className="flex items-center gap-3">
        <AlertTriangle size={18} />
        <span className="text-sm font-medium">{message}</span>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="text-sm font-bold uppercase tracking-widest hover:underline"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
