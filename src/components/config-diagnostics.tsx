type ConfigDiagnosticsProps = {
  browserSupabaseConfigured: boolean;
  appUrl: string;
};

function maskUrl(url: string) {
  if (!url) return "missing";
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "present but invalid";
  }
}

export function ConfigDiagnostics({ browserSupabaseConfigured, appUrl }: ConfigDiagnosticsProps) {
  const showDiagnostics = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_DIAGNOSTICS === "true";

  if (!showDiagnostics) return null;

  const checks = [
    {
      label: "Browser Supabase config",
      ok: browserSupabaseConfigured,
      detail: browserSupabaseConfigured ? "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY detected" : "Missing public Supabase env"
    },
    {
      label: "App URL",
      ok: Boolean(appUrl),
      detail: maskUrl(appUrl)
    },
    {
      label: "Build environment",
      ok: true,
      detail: process.env.NODE_ENV ?? "unknown"
    }
  ];

  return (
    <div className="rounded-3xl border border-violet-200 bg-violet-50 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Config diagnostics</h2>
          <p className="mt-1 text-sm text-slate-600">Safe deployment checks. No secrets shown.</p>
        </div>
        <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-700">debug</div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {checks.map((check) => (
          <div key={check.label} className="rounded-2xl border border-violet-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-900">{check.label}</div>
              <div className={`rounded-full px-2.5 py-1 text-xs font-semibold ${check.ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                {check.ok ? "OK" : "Missing"}
              </div>
            </div>
            <div className="mt-2 text-sm text-slate-600">{check.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
