export const fmt = (n: number) => n.toLocaleString("en-US");
export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });
