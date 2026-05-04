import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "sonner";
import {
  ArrowLeft, ShieldCheck, Check, X, Trash2, ExternalLink,
  Clock, CheckCircle2, XCircle, Sparkles, Filter, RefreshCw,
} from "lucide-react";

type Status = "pending" | "approved" | "rejected";
type Req = {
  id: string;
  name: string;
  url: string;
  reason: string | null;
  status: Status;
  user_id: string | null;
  created_at: string;
};

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [requests, setRequests] = useState<Req[]>([]);
  const [filter, setFilter] = useState<Status | "all">("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    const { data, error } = await supabase
      .from("link_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setRefreshing(false);
    if (error) {
      toast.error("Couldn't load requests");
      return;
    }
    setRequests((data as Req[]) || []);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const setStatus = async (id: string, status: Status) => {
    setBusyId(id);
    const { error } = await supabase
      .from("link_requests")
      .update({ status })
      .eq("id", id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Approved 🌷" : "Rejected");
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this request permanently?")) return;
    setBusyId(id);
    const { error } = await supabase.from("link_requests").delete().eq("id", id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    setRequests((rs) => rs.filter((r) => r.id !== id));
  };

  const filtered = useMemo(
    () => (filter === "all" ? requests : requests.filter((r) => r.status === filter)),
    [requests, filter],
  );

  const counts = useMemo(() => ({
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    all: requests.length,
  }), [requests]);

  if (authLoading || roleLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <ShieldCheck className="h-12 w-12 text-[hsl(var(--primary))] mb-3" />
        <h1 className="text-2xl font-bold mb-2">Admins only</h1>
        <p className="text-sm text-muted-foreground mb-4">
          You're signed in as <span className="font-medium">{user.email}</span> but don't have moderator access.
        </p>
        <Link to="/" className="rounded-full bg-[hsl(var(--pastel-lavender))] px-4 py-2 text-sm font-semibold text-[hsl(280_50%_25%)]">
          Back to Bloom
        </Link>
      </main>
    );
  }

  const statusBadge = (s: Status) => {
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
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[hsl(var(--pastel-lavender))] opacity-30 blur-3xl" />
        <div className="absolute bottom-0 -right-40 h-96 w-96 rounded-full bg-[hsl(var(--pastel-mint))] opacity-40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <button
            onClick={load}
            disabled={refreshing}
            className="glass inline-flex items-center gap-1 rounded-full border border-white/60 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <header className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold inline-flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-[hsl(var(--primary))]" />
            <span className="bg-gradient-to-r from-[hsl(280_60%_55%)] via-[hsl(340_70%_60%)] to-[hsl(25_85%_60%)] bg-clip-text text-transparent">
              Moderation
            </span>
            <Sparkles className="h-6 w-6 text-[hsl(var(--primary))]" />
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Approve or reject link suggestions.</p>
        </header>

        <div className="glass mb-5 flex items-center gap-1 rounded-full border border-white/70 p-1 shadow-[var(--shadow-soft)] w-fit mx-auto">
          <Filter className="h-4 w-4 ml-2 text-foreground/50" />
          {(["pending", "approved", "rejected", "all"] as const).map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "bg-[hsl(var(--pastel-lavender))] text-[hsl(280_50%_25%)] shadow-sm"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                {f} <span className="opacity-60">({counts[f]})</span>
              </button>
            );
          })}
        </div>

        <ul className="space-y-3">
          {filtered.length === 0 && (
            <li className="text-center text-sm text-muted-foreground py-10">Nothing here 🌸</li>
          )}
          {filtered.map((r) => (
            <li key={r.id} className="glass rounded-2xl border border-white/70 p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{r.name}</h3>
                    {statusBadge(r.status)}
                    {!r.user_id && <span className="text-xs text-muted-foreground italic">anonymous</span>}
                  </div>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground break-all"
                  >
                    {r.url} <ExternalLink className="h-3 w-3" />
                  </a>
                  {r.reason && (
                    <p className="mt-2 rounded-xl bg-white/40 px-3 py-2 text-sm text-foreground/80">{r.reason}</p>
                  )}
                  <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()} · id: {r.id.slice(0, 8)}
                    {r.user_id && <> · user: {r.user_id.slice(0, 8)}</>}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setStatus(r.id, "approved")}
                  disabled={busyId === r.id || r.status === "approved"}
                  className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--pastel-mint))] px-3 py-1.5 text-xs font-semibold text-[hsl(150_50%_22%)] disabled:opacity-50"
                >
                  <Check className="h-3 w-3" /> Approve
                </button>
                <button
                  onClick={() => setStatus(r.id, "rejected")}
                  disabled={busyId === r.id || r.status === "rejected"}
                  className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--pastel-rose))] px-3 py-1.5 text-xs font-semibold text-[hsl(340_50%_25%)] disabled:opacity-50"
                >
                  <X className="h-3 w-3" /> Reject
                </button>
                <button
                  onClick={() => setStatus(r.id, "pending")}
                  disabled={busyId === r.id || r.status === "pending"}
                  className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--pastel-yellow))] px-3 py-1.5 text-xs font-semibold text-[hsl(40_50%_22%)] disabled:opacity-50"
                >
                  <Clock className="h-3 w-3" /> Mark pending
                </button>
                <button
                  onClick={() => remove(r.id)}
                  disabled={busyId === r.id}
                  className="ml-auto inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/40 px-3 py-1.5 text-xs font-semibold hover:bg-white/60 disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
};

export default Admin;
