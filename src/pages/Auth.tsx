import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Sparkles } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(100),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account 💌");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Welcome back 🌷");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[hsl(var(--pastel-pink))] opacity-40 blur-3xl" />
        <div className="absolute bottom-0 -right-40 h-96 w-96 rounded-full bg-[hsl(var(--pastel-sky))] opacity-50 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Bloom
        </Link>
        <div className="glass rounded-3xl border border-white/70 p-7 shadow-[var(--shadow-glow)]">
          <div className="mb-5 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[hsl(var(--primary))]" />
            <h1 className="text-2xl font-bold">{mode === "signin" ? "Welcome back" : "Create account"}</h1>
          </div>
          <p className="mb-5 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to track your link requests."
              : "Sign up so your name shows on your requests (optional!)."}
          </p>

          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              maxLength={255}
              required
              className="w-full rounded-2xl border border-white/70 bg-white/60 px-4 py-2.5 outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (6+ chars)"
              maxLength={100}
              required
              className="w-full rounded-2xl border border-white/70 bg-white/60 px-4 py-2.5 outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-2xl bg-[hsl(var(--pastel-lavender))] px-4 py-2.5 font-semibold text-[hsl(280_50%_25%)] transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
            >
              {busy ? "..." : mode === "signin" ? "Sign in" : "Sign up"}
            </button>
          </form>

          <button
            onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "No account? Sign up" : "Have an account? Sign in"}
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          You can still submit requests anonymously without an account 🌸
        </p>
      </div>
    </main>
  );
};

export default Auth;
