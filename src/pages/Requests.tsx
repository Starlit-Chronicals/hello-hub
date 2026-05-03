import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Send, Trash2, LogIn, LogOut, Sparkles, Clock, CheckCircle2, XCircle } from "lucide-react";

type Req = {
  id: string;
  name: string;
  url: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  user_id: string | null;
  created_at: string;
};

const schema = z.object({
  name: z.string().trim().min(1, "Name required").max(80),
  url: z.string().trim().min(3, "URL required").max(500),
  reason: z.string().trim().max(500).optional(),
});

const Requests = () => {
  const { user, signOut } = useAuth();
  const [requests, setRequests] = useState<Req[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("link_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      toast.error("Couldn't load requests");
      return;
    }
    setRequests((data as Req[]) || []);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanUrl = url.trim();
    if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) cleanUrl = `https://${cleanUrl}`;
    const parsed = schema.safeParse({ name, url: cleanUrl, reason: reason || undefined });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("link_requests").insert({
      name: parsed.data.name,
      url: parsed.data.url,
      reason: parsed.data.reason ?? null,
      user_id: user?.id ?? null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Request submitted 🌸");
    setName(""); setUrl(""); setReason("");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("link_requests").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const statusBadge = (s: Req["status"]) => {
    const map = {
      pending: { Icon: Clock, cls: "bg-[hsl(var(--pastel-yellow))]" },
      approved: { Icon: CheckCircle2, cls: "bg-[hsl(var(--pastel-mint))]" },
      rejected: { Icon: XCircle, cls: "bg-[hsl(var(--pastel-rose))]" },
    }[s];
    const Icon = map.Icon;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${map.cls}`}>
        <Icon className="h-3 w-3" /> {s}
      </span>
    );
  };

  return (
    <main className="relative min-h-screen px-4 py-8 md:py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[hsl(var(--pastel-pink))] opacity-30 blur-3xl" />
        <div className="absolute bottom-0 -right-40 h-96 w-96 rounded-full bg-[hsl(var(--pastel-sky))] opacity-40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>
                <button onClick={() => signOut()} className="glass inline-flex items-center gap-1 rounded-full border border-white/60 px-3 py-1.5 text-xs font-semibold">
                  <LogOut className="h-3 w-3" /> Sign out
                </button>
              </>
            ) : (
              <Link to="/auth" className="glass inline-flex items-center gap-1 rounded-full border border-white/60 px-3 py-1.5 text-xs font-semibold">
                <LogIn className="h-3 w-3" /> Sign in
              </Link>
            )}
          </div>
        </div>

        <header className="mb-7 text-center">
          <h1 className="text-3xl md:text-4xl font-bold">
            <span className="bg-gradient-to-r from-[hsl(280_60%_55%)] via-[hsl(340_70%_60%)] to-[hsl(25_85%_60%)] bg-clip-text text-transparent">
              Suggest a link
            </span>{" "}
            <Sparkles className="inline h-7 w-7 text-[hsl(var(--primary))]" />
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Got a site that should be on Bloom? Tell us! Submit anonymously or sign in to track yours.
          </p>
        </header>

        <form onSubmit={submit} className="glass mb-8 rounded-3xl border border-white/70 p-5 shadow-[var(--shadow-card)] space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Site name (e.g. Khan Academy)"
            className="w-full rounded-2xl border border-white/70 bg-white/60 px-4 py-2.5 outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            maxLength={500}
            placeholder="URL (e.g. khanacademy.org)"
            className="w-full rounded-2xl border border-white/70 bg-white/60 px-4 py-2.5 outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          />
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Why? (optional)"
            className="w-full rounded-2xl border border-white/70 bg-white/60 px-4 py-2.5 outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] resize-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {user ? "Submitting as you" : "Submitting anonymously"}
            </p>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--pastel-lavender))] px-5 py-2 text-sm font-semibold text-[hsl(280_50%_25%)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
            >
              <Send className="h-4 w-4" /> Submit
            </button>
          </div>
        </form>

        <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Recent suggestions ({requests.length})
        </h2>
        <ul className="space-y-2">
          {requests.length === 0 && (
            <li className="text-center text-sm text-muted-foreground py-6">No requests yet — be first 🌷</li>
          )}
          {requests.map((r) => (
            <li key={r.id} className="glass flex items-start justify-between gap-3 rounded-2xl border border-white/70 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{r.name}</span>
                  {statusBadge(r.status)}
                  {!r.user_id && <span className="text-xs text-muted-foreground italic">anonymous</span>}
                </div>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground break-all">
                  {r.url}
                </a>
                {r.reason && <p className="mt-1 text-sm text-foreground/80">{r.reason}</p>}
              </div>
              {user && r.user_id === user.id && (
                <button onClick={() => remove(r.id)} className="rounded-full p-2 hover:bg-white/40" aria-label="Delete">
                  <Trash2 className="h-4 w-4 text-foreground/60" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
};

export default Requests;
