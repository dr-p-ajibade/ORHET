import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";

export default function NotFound() {
  return (
    <div className="wrap py-24 md:py-36">
      <p className="label text-clay">Page not found</p>
      <h1 className="display mt-4 text-5xl md:text-7xl">That page has <em>moved on.</em></h1>
      <p className="mt-5 max-w-xl text-lg text-ink/75">Search the archive, or head back to the start.</p>
      <div className="mt-8 max-w-xl"><SearchBox tone="paper" id="nf-q" /></div>
      <Link href="/" className="btn btn-line mt-6">Back to home</Link>
    </div>
  );
}
