"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";

type ProfileRow = {
  email: string | null;
  tradingview_webhook_token: string;
};

export function IntegrationGuide() {
  const [status, setStatus] = useState(
    isSupabaseConfigured()
      ? "Sign in to reveal your personal TradingView webhook token."
      : "Supabase not configured yet. Integration is currently in demo mode."
  );
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");

  useEffect(() => {
    async function loadProfile() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus("Sign in first, then come back here to copy your personal webhook token.");
        return;
      }

      const { data: existing } = await supabase
        .from("profiles")
        .select("email, tradingview_webhook_token")
        .eq("id", user.id)
        .maybeSingle();

      if (existing) {
        setProfile(existing);
        setStatus("Profile found. You can now test the real TradingView import flow.");
        return;
      }

      const { data: created, error } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          display_name: user.email?.split("@")[0] ?? "Trader"
        })
        .select("email, tradingview_webhook_token")
        .single();

      if (error) {
        setStatus(`Could not create profile automatically: ${error.message}`);
        return;
      }

      setProfile(created);
      setStatus("Profile created. Your TradingView token is ready.");
    }

    loadProfile();
  }, []);

  const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/tradingview/webhook`;
  const samplePayload = `{
  "secret": "your-shared-secret",
  "token": "${profile?.tradingview_webhook_token ?? "sign-in-to-see-token"}",
  "symbol": "{{ticker}}",
  "direction": "Long",
  "entry": "{{close}}",
  "stopLoss": "{{close}}",
  "target": "{{close}}",
  "strategySlug": "breakout-pullback",
  "thesis": "TradingView alert fired.",
  "marketContext": "Imported from TradingView alert.",
  "emotions": ["Calm"],
  "confidence": 60
}`;

  return (
    <AppShell
      title="TradingView paper trading connection guide"
      description="Connect safely in layers. First make the review loop real, then pipe TradingView alerts into the journal so the workflow starts feeling alive."
    >
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">What is realistically possible right now</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700">
            <p>
              TradingView is excellent for charts and alerts. For this MVP, the smartest workflow is not full automation — it is review + import.
            </p>
            <ul className="space-y-2">
              <li>• explain the trade in TradeGate</li>
              <li>• get PASS / WARN / FAIL with checklist coverage</li>
              <li>• place the paper trade manually in TradingView if you still want it</li>
              <li>• send TradingView alerts back into TradeGate for journaling and review history</li>
            </ul>
            <p>
              That is enough to test whether this product actually changes behavior, which matters more right now than broker automation.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-[#0f172a] p-6 text-white shadow-sm">
          <h2 className="text-2xl font-semibold">Live integration state</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">{status}</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-slate-400">Signed-in email</div>
              <div className="mt-1 font-semibold text-cyan-200">{profile?.email ?? "Not signed in"}</div>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-slate-400">Personal webhook token</div>
              <div className="mt-1 break-all font-mono text-cyan-200">
                {profile?.tradingview_webhook_token ?? "Sign in to reveal token"}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/review" className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
                Test review flow
              </Link>
              <Link href="/journal?source=tradingview-webhook" className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                Open imported alerts
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-950">Webhook endpoint</h2>
        <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-sm text-slate-100">
          <pre>{webhookUrl}</pre>
        </div>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Use this URL inside a TradingView alert webhook. The payload needs both the shared secret and your profile token so the alert lands in the right user journal.
        </p>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">Sample TradingView payload</h2>
          <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-sm text-slate-100">
            <pre>{samplePayload}</pre>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">Practical test sequence</h2>
          <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
            <li>1. Sign in with your real email via magic link</li>
            <li>2. Open this page and copy your profile token</li>
            <li>3. Add the webhook URL and JSON payload in TradingView alert settings</li>
            <li>4. Keep the secret exactly equal to your configured `TRADINGVIEW_WEBHOOK_SECRET`</li>
            <li>5. Fire a test alert</li>
            <li>6. Check the imported alert queue in the journal</li>
          </ol>
        </div>
      </section>
    </AppShell>
  );
}
