interface KPICardProps {
  label: string
  value: string | number
  accent?: boolean
}

export function KPICard({ label, value, accent = false }: KPICardProps) {
  return (
    <div className="border border-border-subtle bg-white p-5 shadow-custom">
      <span className="text-2xs font-bold uppercase tracking-widest text-foreground/50">
        {label}
      </span>
      <div
        className={`mt-2 text-4xl font-light ${accent ? 'text-accent' : 'text-foreground'}`}
      >
        {value}
      </div>
    </div>
  )
}
