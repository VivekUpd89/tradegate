import Link from "next/link";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/review", label: "Review" },
  { href: "/journal", label: "Journal" },
  { href: "/strategies", label: "Strategies" },
  { href: "/integration", label: "TradingView" },
  { href: "/deploy", label: "Deploy" }
];

export function AppShell({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
      <header className="mb-8 rounded-3xl border border-white/50 bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-700">
              TradeGate
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
