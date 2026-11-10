export function SearchBox({ defaultValue = "", tone = "ink", id = "q", autoFocus = false }: { defaultValue?: string; tone?: "ink" | "paper"; id?: string; autoFocus?: boolean }) {
  const ink = tone === "ink";
  return (
    <form action="/search" role="search" className={`flex items-center gap-2 rounded-full border p-1.5 pl-5 ${ink ? "border-paper/30 bg-paper/5 focus-within:border-ochre" : "border-ink/25 bg-white/60 focus-within:border-clay"}`}>
      <label htmlFor={id} className="sr-only">Search open scholarship</label>
      <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5 shrink-0 opacity-60" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="9" r="6" /><path d="m14 14 4 4" strokeLinecap="round" /></svg>
      <input id={id} name="q" type="search" required defaultValue={defaultValue} autoFocus={autoFocus} placeholder="Topic, title, author or DOI"
        className={`min-w-0 flex-1 bg-transparent py-2.5 text-base outline-none ${ink ? "placeholder:text-paper/45" : "placeholder:text-ink/45"}`} />
      <button className="btn btn-clay shrink-0">Search</button>
    </form>
  );
}
