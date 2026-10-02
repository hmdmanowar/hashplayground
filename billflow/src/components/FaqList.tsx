function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-[var(--border-panel)] rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)]">
      {items.map((item) => (
        <details key={item.q} className="group px-4 py-3">
          <summary className="cursor-pointer list-none text-sm font-medium marker:hidden">
            <span className="flex items-center justify-between gap-3">
              {item.q}
              <span className="text-lg leading-none text-[var(--color-muted)] transition-transform group-open:rotate-45">+</span>
            </span>
          </summary>
          <p className="mt-2 text-sm text-[var(--color-muted)]">{item.a}</p>
        </details>
      ))}
    </div>
  )
}

export default FaqList
