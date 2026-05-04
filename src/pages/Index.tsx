import { useEffect, useMemo, useState } from "react";
import {
  Search,
  FileText,
  StickyNote,
  Users,
  Mail,
  MailOpen,
  Youtube,
  MessageCircle,
  HardDrive,
  Calendar,
  FileSpreadsheet,
  Presentation,
  BookOpen,
  Globe,
  Music,
  Image as ImageIcon,
  Cloud,
  Sparkles,
  Calculator,
  Sun,
  Moon,
  Github,
  Bot,
  Map as MapIcon,
  Languages,
  Newspaper,
  ShoppingBag,
  Trash2,
  Plus,
  Palette,
  Lock,
  Link as LinkIcon,
  X,
  LogIn,
  LogOut,
  UserCircle,
} from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

type Mode = "school" | "strict" | "home";

type Tile = {
  name: string;
  url: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  category: "Microsoft" | "Google" | "Social" | "Study" | "Dev" | "Custom";
  tags?: Array<"ai" | "video" | "social">;
};

const TILES: Tile[] = [
  // Microsoft
  { name: "Word", url: "https://www.office.com/launch/word", Icon: FileText, color: "sky", category: "Microsoft" },
  { name: "OneNote", url: "https://www.onenote.com/notebooks", Icon: StickyNote, color: "lavender", category: "Microsoft" },
  { name: "Teams", url: "https://teams.microsoft.com", Icon: Users, color: "lilac", category: "Microsoft" },
  { name: "Outlook", url: "https://outlook.office.com/mail", Icon: MailOpen, color: "sky", category: "Microsoft" },
  { name: "Excel", url: "https://www.office.com/launch/excel", Icon: FileSpreadsheet, color: "mint", category: "Microsoft" },
  { name: "PowerPoint", url: "https://www.office.com/launch/powerpoint", Icon: Presentation, color: "peach", category: "Microsoft" },
  { name: "OneDrive", url: "https://onedrive.live.com", Icon: Cloud, color: "sky", category: "Microsoft" },
  { name: "Copilot", url: "https://copilot.microsoft.com", Icon: Bot, color: "lavender", category: "Microsoft", tags: ["ai"] },

  // Google
  { name: "Gmail", url: "https://mail.google.com", Icon: Mail, color: "rose", category: "Google" },
  { name: "Drive", url: "https://drive.google.com", Icon: HardDrive, color: "yellow", category: "Google" },
  { name: "Classroom", url: "https://classroom.google.com", Icon: BookOpen, color: "mint", category: "Google" },
  { name: "Calendar", url: "https://calendar.google.com", Icon: Calendar, color: "pink", category: "Google" },
  { name: "Docs", url: "https://docs.google.com", Icon: FileText, color: "sky", category: "Google" },
  { name: "Maps", url: "https://maps.google.com", Icon: MapIcon, color: "mint", category: "Google" },
  { name: "Translate", url: "https://translate.google.com", Icon: Languages, color: "lilac", category: "Google" },
  { name: "News", url: "https://news.google.com", Icon: Newspaper, color: "peach", category: "Google" },

  // Study
  { name: "Quizlet", url: "https://quizlet.com", Icon: BookOpen, color: "peach", category: "Study" },
  { name: "Desmos", url: "https://www.desmos.com/calculator", Icon: Calculator, color: "yellow", category: "Study" },
  { name: "Wikipedia", url: "https://www.wikipedia.org", Icon: Globe, color: "lilac", category: "Study" },
  { name: "ChatGPT", url: "https://chat.openai.com", Icon: Sparkles, color: "pink", category: "Study", tags: ["ai"] },

  // Dev
  { name: "GitHub", url: "https://github.com", Icon: Github, color: "lavender", category: "Dev" },

  // Social
  { name: "YouTube", url: "https://www.youtube.com", Icon: Youtube, color: "rose", category: "Social", tags: ["video", "social"] },
  { name: "Discord", url: "https://discord.com/app", Icon: MessageCircle, color: "lavender", category: "Social", tags: ["social"] },
  { name: "Spotify", url: "https://open.spotify.com", Icon: Music, color: "mint", category: "Social", tags: ["social"] },
  { name: "Pinterest", url: "https://www.pinterest.com", Icon: ImageIcon, color: "pink", category: "Social", tags: ["social"] },
  { name: "Amazon", url: "https://www.amazon.com", Icon: ShoppingBag, color: "yellow", category: "Social", tags: ["social"] },
];

const CATEGORIES: Array<Tile["category"]> = ["Microsoft", "Google", "Study", "Dev", "Social", "Custom"];

const colorMap: Record<string, string> = {
  pink: "bg-[hsl(var(--pastel-pink))]",
  peach: "bg-[hsl(var(--pastel-peach))]",
  yellow: "bg-[hsl(var(--pastel-yellow))]",
  mint: "bg-[hsl(var(--pastel-mint))]",
  sky: "bg-[hsl(var(--pastel-sky))]",
  lavender: "bg-[hsl(var(--pastel-lavender))]",
  rose: "bg-[hsl(var(--pastel-rose))]",
  lilac: "bg-[hsl(var(--pastel-lilac))]",
};
const COLOR_KEYS = Object.keys(colorMap);

const MODE_LABELS: Record<Mode, { emoji: string; label: string; hint: string }> = {
  school: { emoji: "📚", label: "At School", hint: "Hides social, video & AI" },
  strict: { emoji: "🔒", label: "Limited", hint: "Hides social & video (study AI ok)" },
  home: { emoji: "🌷", label: "At Home", hint: "Everything visible" },
};

// Filtering rules per mode
const isVisibleInMode = (t: Tile, mode: Mode) => {
  if (mode === "home") return true;
  const tags = t.tags ?? [];
  if (mode === "school") {
    // Hide social, video AND ai (no ChatGPT/Copilot at school)
    return !tags.some((tg) => tg === "social" || tg === "video" || tg === "ai");
  }
  // strict / limited: hide social + video, allow ai
  return !tags.some((tg) => tg === "social" || tg === "video");
};

type CustomLink = { id: string; name: string; url: string; color: string };

const PROJECT_GITHUB = "https://github.com/"; // user can replace via custom link

const Index = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [time, setTime] = useState(new Date());
  const [query, setQuery] = useState("");

  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === "undefined") return "school";
    const stored = window.localStorage.getItem("bloom-mode");
    if (stored === "school" || stored === "strict" || stored === "home") return stored;
    return "school";
  });

  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem("bloom-dark");
    if (stored !== null) return stored === "true";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  // Accent hue (0–360) for theme customization
  const [accentHue, setAccentHue] = useState<number>(() => {
    if (typeof window === "undefined") return 280;
    const v = window.localStorage.getItem("bloom-hue");
    return v ? Number(v) : 280;
  });

  // Custom user-added links
  const [customLinks, setCustomLinks] = useState<CustomLink[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem("bloom-custom-links") || "[]");
    } catch {
      return [];
    }
  });

  // Passkey gate
  const [passkey, setPasskey] = useState<string>(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem("bloom-passkey") || ""
  );
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [settingNewPin, setSettingNewPin] = useState(false);

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [accountBusy, setAccountBusy] = useState(false);

  const updateEmail = async () => {
    const parsed = z.string().trim().email("Enter a valid email").max(255).safeParse(newEmail);
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    setAccountBusy(true);
    const { error } = await supabase.auth.updateUser({ email: parsed.data });
    setAccountBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Check both inboxes to confirm the change 💌");
    setNewEmail("");
  };

  const signOutEverywhere = async () => {
    setAccountBusy(true);
    const { error } = await supabase.auth.signOut({ scope: "global" });
    setAccountBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Signed out from all devices 🌙");
    setShowAccount(false);
  };
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newColor, setNewColor] = useState("lavender");

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("bloom-mode", mode);
  }, [mode]);

  useEffect(() => {
    window.localStorage.setItem("bloom-dark", String(dark));
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    window.localStorage.setItem("bloom-hue", String(accentHue));
    const root = document.documentElement;
    root.style.setProperty("--pastel-lavender", `${accentHue} 75% 88%`);
    root.style.setProperty("--pastel-pink", `${(accentHue + 60) % 360} 90% 88%`);
    root.style.setProperty("--pastel-sky", `${(accentHue + 280) % 360} 85% 85%`);
    root.style.setProperty("--pastel-lilac", `${(accentHue + 10) % 360} 70% 87%`);
    root.style.setProperty("--primary", `${accentHue} 60% 75%`);
    root.style.setProperty("--ring", `${accentHue} 60% 75%`);
  }, [accentHue]);

  useEffect(() => {
    window.localStorage.setItem("bloom-custom-links", JSON.stringify(customLinks));
  }, [customLinks]);

  const allTiles = useMemo(() => {
    const customTiles: Tile[] = customLinks.map((l) => ({
      name: l.name,
      url: l.url,
      Icon: LinkIcon,
      color: l.color,
      category: "Custom",
    }));
    return [...TILES, ...customTiles];
  }, [customLinks]);

  const visibleTiles = useMemo(
    () => allTiles.filter((t) => isVisibleInMode(t, mode)),
    [allTiles, mode]
  );

  const greeting = useMemo(() => {
    const h = time.getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, [time]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || q.length > 500) return;
    // URL detection
    const isUrl = /^(https?:\/\/|www\.)|\.[a-z]{2,}(\/|$)/i.test(q);
    const url = isUrl
      ? q.startsWith("http") ? q : `https://${q}`
      : `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Mode change with passkey protection going from restricted -> home
  const requestModeChange = (next: Mode) => {
    if (next === mode) return;
    const looseningToHome = next === "home" && (mode === "school" || mode === "strict");
    if (!looseningToHome) {
      setMode(next);
      return;
    }
    if (!passkey) {
      // First time — let them set one
      setPendingMode(next);
      setSettingNewPin(true);
      setPinInput("");
      setPinError("");
      return;
    }
    setPendingMode(next);
    setSettingNewPin(false);
    setPinInput("");
    setPinError("");
  };

  const submitPin = () => {
    if (settingNewPin) {
      if (pinInput.length < 4) {
        setPinError("Pick at least 4 characters");
        return;
      }
      window.localStorage.setItem("bloom-passkey", pinInput);
      setPasskey(pinInput);
      if (pendingMode) setMode(pendingMode);
      setPendingMode(null);
      setPinInput("");
      return;
    }
    if (pinInput === passkey) {
      if (pendingMode) setMode(pendingMode);
      setPendingMode(null);
      setPinInput("");
    } else {
      setPinError("Wrong passkey 🥲");
    }
  };

  const resetPasskey = () => {
    if (!confirm("Reset your passkey? You'll set a new one next time.")) return;
    window.localStorage.removeItem("bloom-passkey");
    setPasskey("");
  };

  const addCustomLink = () => {
    const name = newName.trim();
    let url = newUrl.trim();
    if (!name || !url) return;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    setCustomLinks((s) => [...s, { id: crypto.randomUUID(), name, url, color: newColor }]);
    setNewName("");
    setNewUrl("");
    setShowAdd(false);
  };

  const removeCustomLink = (id: string) => {
    setCustomLinks((s) => s.filter((l) => l.id !== id));
  };

  const dateString = time.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timeString = time.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Decorative blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[hsl(var(--pastel-pink))] opacity-40 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-[hsl(var(--pastel-sky))] opacity-50 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-[hsl(var(--pastel-lavender))] opacity-40 blur-3xl" />
      </div>

      {/* Floating buttons */}
      <div className="fixed right-4 top-4 z-20 flex items-center gap-2">
        {user ? (
          <button
            type="button"
            onClick={() => setShowAccount(true)}
            aria-label="Account settings"
            title={user.email ?? "Account"}
            className="glass flex h-11 items-center gap-1.5 rounded-full border border-white/60 px-4 shadow-[var(--shadow-soft)] transition-transform hover:scale-105 active:scale-95"
          >
            <UserCircle className="h-5 w-5 text-foreground/70" />
            <span className="hidden sm:inline text-xs font-semibold text-foreground/80 max-w-[160px] truncate">
              {user.email}
            </span>
          </button>
        ) : (
          <RouterLink
            to="/auth"
            aria-label="Sign in"
            title="Sign in / Sign up"
            className="glass flex h-11 items-center gap-1.5 rounded-full border border-white/60 px-4 shadow-[var(--shadow-soft)] transition-transform hover:scale-105 active:scale-95"
          >
            <LogIn className="h-4 w-4 text-foreground/70" />
            <span className="text-xs font-semibold text-foreground/80">Sign in</span>
          </RouterLink>
        )}
        <button
          type="button"
          onClick={() => setShowTheme(true)}
          aria-label="Customize theme"
          className="glass flex h-11 w-11 items-center justify-center rounded-full border border-white/60 shadow-[var(--shadow-soft)] transition-transform hover:scale-110 active:scale-95"
        >
          <Palette className="h-5 w-5 text-foreground/70" />
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={dark}
          aria-label="Toggle dark mode"
          onClick={() => setDark((v) => !v)}
          className="glass flex h-11 w-11 items-center justify-center rounded-full border border-white/60 shadow-[var(--shadow-soft)] transition-transform hover:scale-110 active:scale-95"
        >
          {dark ? <Sun className="h-5 w-5 text-[hsl(var(--pastel-yellow))]" /> : <Moon className="h-5 w-5 text-foreground/70" />}
        </button>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-8 md:py-12">
        {/* Header */}
        <header className="mb-8 flex flex-col items-center text-center">
          <div className="glass mb-5 flex items-center gap-2 rounded-full border border-white/60 px-4 py-1.5 shadow-[var(--shadow-soft)]">
            <Sparkles className="h-4 w-4 text-foreground/70" />
            <span className="text-sm font-medium text-foreground/80">
              {dateString} · {timeString} · {tz.split("/").pop()?.replace("_", " ")}
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            <span className="bg-gradient-to-r from-[hsl(280_60%_55%)] via-[hsl(340_70%_60%)] to-[hsl(25_85%_60%)] bg-clip-text text-transparent">
              {greeting}
            </span>
            <span className="ml-2">🌷</span>
          </h1>

          {/* Mode picker */}
          <div role="radiogroup" aria-label="Visibility mode" className="glass mt-5 flex items-center gap-1 rounded-full border border-white/60 p-1 shadow-[var(--shadow-soft)]">
            {(Object.keys(MODE_LABELS) as Mode[]).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  role="radio"
                  aria-checked={active}
                  onClick={() => requestModeChange(m)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all md:text-sm md:px-4 md:py-2 ${
                    active
                      ? "bg-[hsl(var(--pastel-lavender))] text-[hsl(280_50%_25%)] shadow-sm"
                      : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  <span className="mr-1">{MODE_LABELS[m].emoji}</span>
                  {MODE_LABELS[m].label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{MODE_LABELS[mode].hint}</p>
        </header>

        {/* Search */}
        <form onSubmit={handleSearch} className="mx-auto mb-10 max-w-2xl">
          <label htmlFor="search" className="sr-only">Search the web</label>
          <div className="glass flex items-center gap-3 rounded-full border border-white/70 px-5 py-3 shadow-[var(--shadow-card)] transition-all focus-within:shadow-[var(--shadow-glow)]">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              id="search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={500}
              placeholder="Search Google or type a URL..."
              className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
              autoFocus
            />
            <button type="submit" className="rounded-full bg-[hsl(var(--pastel-lavender))] px-4 py-1.5 text-sm font-semibold text-[hsl(280_50%_25%)] transition-transform hover:scale-105 active:scale-95">
              Go
            </button>
          </div>
        </form>

        {/* Tiles */}
        <section className="space-y-8" aria-label="Quick links">
          {CATEGORIES.map((cat) => {
            const tiles = visibleTiles.filter((t) => t.category === cat);
            const isCustom = cat === "Custom";
            if (tiles.length === 0 && !isCustom) return null;
            return (
              <div key={cat}>
                <div className="mb-3 flex items-center justify-between px-2">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{cat}</h2>
                  {isCustom && (
                    <button
                      onClick={() => setShowAdd(true)}
                      className="glass flex items-center gap-1 rounded-full border border-white/60 px-3 py-1 text-xs font-semibold text-foreground/80 hover:scale-105 transition-transform"
                    >
                      <Plus className="h-3 w-3" /> Add link
                    </button>
                  )}
                </div>
                {tiles.length === 0 ? (
                  <p className="px-2 text-xs text-muted-foreground/70">No custom links yet — add your own ✨</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                    {tiles.map((tile) => (
                      <div key={tile.name + tile.url} className="relative group">
                        <a
                          href={tile.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tile-hover glass flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/70 p-3 shadow-[var(--shadow-card)]"
                        >
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[tile.color] || colorMap.lavender} shadow-inner`}>
                            <tile.Icon className="h-5 w-5 text-foreground/80" />
                          </div>
                          <span className="text-xs font-semibold text-foreground/85 text-center leading-tight">{tile.name}</span>
                        </a>
                        {isCustom && (
                          <button
                            onClick={() => {
                              const cl = customLinks.find((l) => l.url === tile.url && l.name === tile.name);
                              if (cl) removeCustomLink(cl.id);
                            }}
                            className="absolute -right-1 -top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--pastel-rose))] text-foreground/70 shadow group-hover:flex"
                            aria-label={`Remove ${tile.name}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <footer className="mt-12 flex flex-col items-center gap-2 text-center text-xs text-muted-foreground/80">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="/requests" className="inline-flex items-center gap-1 hover:text-foreground/80">
              <Sparkles className="h-3 w-3" /> Suggest a link
            </a>
            <a href={PROJECT_GITHUB} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground/80">
              <Github className="h-3 w-3" /> Project on GitHub
            </a>
            {passkey && (
              <button onClick={resetPasskey} className="inline-flex items-center gap-1 hover:text-foreground/80">
                <Lock className="h-3 w-3" /> Reset passkey
              </button>
            )}
          </div>
          <p>made with 🌸 · set this page as your browser homepage to bloom every morning</p>
        </footer>
      </div>

      {/* Passkey modal */}
      {pendingMode && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="glass w-full max-w-sm rounded-3xl border border-white/70 p-6 shadow-[var(--shadow-glow)]">
            <div className="mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <h3 className="text-lg font-bold">{settingNewPin ? "Set a passkey" : "Enter passkey"}</h3>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              {settingNewPin
                ? "Pick a passkey (4+ chars). You'll need it to leave a restricted mode again."
                : `Required to switch to ${MODE_LABELS[pendingMode].label}.`}
            </p>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitPin()}
              autoFocus
              className="w-full rounded-2xl border border-white/70 bg-white/60 px-4 py-2 text-base outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              placeholder="••••"
            />
            {pinError && <p className="mt-2 text-xs text-destructive-foreground bg-destructive/70 rounded px-2 py-1">{pinError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setPendingMode(null); setPinInput(""); setPinError(""); }} className="rounded-full px-4 py-2 text-sm font-semibold text-foreground/70 hover:bg-white/40">
                Cancel
              </button>
              <button onClick={submitPin} className="rounded-full bg-[hsl(var(--pastel-lavender))] px-4 py-2 text-sm font-semibold text-[hsl(280_50%_25%)]">
                {settingNewPin ? "Save & switch" : "Unlock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add link modal */}
      {showAdd && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="glass w-full max-w-sm rounded-3xl border border-white/70 p-6 shadow-[var(--shadow-glow)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Add a link</h3>
              <button onClick={() => setShowAdd(false)} className="rounded-full p-1 hover:bg-white/40"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name (e.g. My blog)"
                className="w-full rounded-2xl border border-white/70 bg-white/60 px-4 py-2 outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              />
              <input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="URL (e.g. example.com)"
                className="w-full rounded-2xl border border-white/70 bg-white/60 px-4 py-2 outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              />
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Color</p>
                <div className="flex flex-wrap gap-2">
                  {COLOR_KEYS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={`h-8 w-8 rounded-full ${colorMap[c]} ${newColor === c ? "ring-2 ring-foreground/60" : ""}`}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="rounded-full px-4 py-2 text-sm font-semibold text-foreground/70 hover:bg-white/40">Cancel</button>
              <button onClick={addCustomLink} className="rounded-full bg-[hsl(var(--pastel-lavender))] px-4 py-2 text-sm font-semibold text-[hsl(280_50%_25%)]">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Theme modal */}
      {showTheme && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="glass w-full max-w-sm rounded-3xl border border-white/70 p-6 shadow-[var(--shadow-glow)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2"><Palette className="h-5 w-5" /> Theme</h3>
              <button onClick={() => setShowTheme(false)} className="rounded-full p-1 hover:bg-white/40"><X className="h-4 w-4" /></button>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">Slide to pick your accent hue. Works in light & dark mode.</p>
            <input
              type="range"
              min={0}
              max={360}
              value={accentHue}
              onChange={(e) => setAccentHue(Number(e.target.value))}
              className="w-full"
              style={{
                background: "linear-gradient(to right, hsl(0 80% 70%), hsl(60 80% 70%), hsl(120 80% 70%), hsl(180 80% 70%), hsl(240 80% 70%), hsl(300 80% 70%), hsl(360 80% 70%))",
                borderRadius: "9999px",
                height: "10px",
                appearance: "none",
              }}
            />
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Preview:</span>
              <div className={`h-6 w-6 rounded-full bg-[hsl(var(--pastel-lavender))]`} />
              <div className={`h-6 w-6 rounded-full bg-[hsl(var(--pastel-pink))]`} />
              <div className={`h-6 w-6 rounded-full bg-[hsl(var(--pastel-sky))]`} />
              <span className="ml-auto text-xs text-muted-foreground">{accentHue}°</span>
            </div>
            <div className="mt-5 flex justify-between">
              <button onClick={() => setAccentHue(280)} className="text-xs text-muted-foreground hover:text-foreground">Reset</button>
              <button onClick={() => setShowTheme(false)} className="rounded-full bg-[hsl(var(--pastel-lavender))] px-4 py-2 text-sm font-semibold text-[hsl(280_50%_25%)]">Done</button>
            </div>
          </div>
        </div>
      )}
      {/* Account modal */}
      {showAccount && user && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="glass w-full max-w-md rounded-3xl border border-white/70 p-6 shadow-[var(--shadow-glow)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <UserCircle className="h-5 w-5" /> Account
              </h3>
              <button onClick={() => setShowAccount(false)} className="rounded-full p-1 hover:bg-white/40" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-5 rounded-2xl bg-white/40 px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Signed in as</p>
              <p className="font-medium break-all">{user.email}</p>
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Update email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="new@email.com"
                  maxLength={255}
                  className="flex-1 rounded-2xl border border-white/70 bg-white/60 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                />
                <button
                  onClick={updateEmail}
                  disabled={accountBusy || !newEmail}
                  className="rounded-2xl bg-[hsl(var(--pastel-lavender))] px-4 py-2 text-sm font-semibold text-[hsl(280_50%_25%)] disabled:opacity-50"
                >
                  Update
                </button>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                You'll get a confirmation link at both addresses.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => { signOut(); setShowAccount(false); }}
                className="w-full rounded-2xl border border-white/70 bg-white/40 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/60 inline-flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" /> Sign out (this device)
              </button>
              <button
                onClick={signOutEverywhere}
                disabled={accountBusy}
                className="w-full rounded-2xl bg-[hsl(var(--pastel-rose))] px-4 py-2.5 text-sm font-semibold text-[hsl(340_50%_25%)] transition hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" /> Sign out everywhere
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Index;
