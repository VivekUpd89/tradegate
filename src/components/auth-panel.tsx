"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(
    isSupabaseConfigured() ? "Sign in with a magic link to activate per-user storage." : "Supabase not configured. Auth disabled."
  );
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendMagicLink = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Supabase not configured.");
      return;
    }

    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/review`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    });

    if (error) {
      setMessage(`Sign-in failed: ${error.message}`);
      return;
    }

    setMessage("Magic link sent. Open it from your email on this browser.");
  };

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserEmail(null);
    setMessage("Signed out.");
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-950">Auth</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>

      {userEmail ? (
        <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-slate-500">Signed in as</div>
              <div className="font-semibold text-slate-950">{userEmail}</div>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/review" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:border-slate-300">
              Open review flow
            </Link>
            <Link href="/integration" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:border-slate-300">
              Open integration setup
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-slate-300 px-3 py-3 outline-none focus:border-slate-900"
          />
          <button
            type="button"
            onClick={sendMagicLink}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Send magic link
          </button>
        </div>
      )}
    </div>
  );
}
