export function PageHead({ label, title, children, aside }: { label: string; title: React.ReactNode; children?: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <header className="on-ink relative overflow-hidden bg-ink text-paper">
      <div aria-hidden className="lines-wave absolute inset-0 opacity-[0.07]" />
      <div className="wrap relative grid items-end gap-10 py-16 md:grid-cols-[1fr_auto] md:py-24">
        <div className="min-w-0">
          <p className="label text-ochre">{label}</p>
          <h1 className="display mt-4 max-w-4xl text-[2.6rem] sm:text-6xl md:text-7xl">{title}</h1>
          {children && <div className="mt-6 max-w-2xl text-lg text-paper/75">{children}</div>}
        </div>
        {aside}
      </div>
      <div aria-hidden className="band lines-arc opacity-30" />
    </header>
  );
}
