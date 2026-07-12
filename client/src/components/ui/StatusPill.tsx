interface StatusPillProps {
  variant: 'active' | 'warning' | 'outlined'
  children: React.ReactNode
}

const variants = {
  active: 'bg-foreground text-background',
  warning: 'bg-accent text-white',
  outlined: 'border border-foreground text-foreground',
}

export function StatusPill({ variant, children }: StatusPillProps) {
  return (
    <span
      className={`inline-block px-2 py-1 text-2xs font-bold uppercase ${variants[variant]}`}
    >
      {children}
    </span>
  )
}
