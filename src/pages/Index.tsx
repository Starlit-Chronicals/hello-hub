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
  GraduationCap,
  Globe,
  Music,
  Image as ImageIcon,
  Cloud,
  Sparkles,
} from "lucide-react";

type Tile = {
  name: string;
  url: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string; // pastel token name
  category: "Microsoft" | "Google" | "Social" | "Study";
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

  // Google
  { name: "Gmail", url: "https://mail.google.com", Icon: Mail, color: "rose", category: "Google" },
  { name: "Drive", url: "https://drive.google.com", Icon: HardDrive, color: "yellow", category: "Google" },
  { name: "Classroom", url: "https://classroom.google.com", Icon: GraduationCap, color: "mint", category: "Google" },
  { name: "Calendar", url: "https://calendar.google.com", Icon: Calendar, color: "pink", category: "Google" },
  { name: "Docs", url: "https://docs.google.com", Icon: FileText, color: "sky", category: "Google" },

  // Social
  { name: "YouTube", url: "https://www.youtube.com", Icon: Youtube, color: "rose", category: "Social" },
  { name: "Discord", url: "https://discord.com/app", Icon: MessageCircle, color: "lavender", category: "Social" },
  { name: "Spotify", url: "https://open.spotify.com", Icon: Music, color: "mint", category: "Social" },
  { name: "Pinterest", url: "https://www.pinterest.com", Icon: ImageIcon, color: "pink", category: "Social" },

  // Study
  { name: "Quizlet", url: "https://quizlet.com", Icon: BookOpen, color: "peach", category: "Study" },
  { name: "Khan Academy", url: "https://www.khanacademy.org", Icon: GraduationCap, color: "yellow", category: "Study" },
  { name: "Wikipedia", url: "https://www.wikipedia.org", Icon: Globe, color: "lilac", category: "Study" },
  { name: "ChatGPT", url: "https://chat.openai.com", Icon: Sparkles, color: "pink", category: "Study" },
];

const CATEGORIES: Array<Tile["category"]> = ["Microsoft", "Google", "Study", "Social"];

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

const Index = () => {
  const [time, setTime] = useState(new Date());
  const [query, setQuery] = useState("");

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  const greeting = useMemo(() => {
    const h = time.getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, [time]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    window.open(url, "_blank", "noopener,noreferrer");
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

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Decorative blurred blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[hsl(var(--pastel-pink))] opacity-40 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-[hsl(var(--pastel-sky))] opacity-50 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-[hsl(var(--pastel-lavender))] opacity-40 blur-3xl" />
        <div className="absolute top-10 right-1/3 h-64 w-64 rounded-full bg-[hsl(var(--pastel-yellow))] opacity-30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-10 md:py-14">
        {/* Header */}
        <header className="mb-10 flex flex-col items-center text-center">
          <div className="glass mb-6 flex items-center gap-2 rounded-full border border-white/60 px-4 py-1.5 shadow-[var(--shadow-soft)]">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
            <span className="text-sm font-medium text-foreground/80">
              {dateString} · {timeString}
            </span>
          </div>

          <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
            <span className="bg-gradient-to-r from-[hsl(280_60%_55%)] via-[hsl(340_70%_60%)] to-[hsl(25_85%_60%)] bg-clip-text text-transparent">
              {greeting}, sunshine
            </span>
            <span className="ml-2">🌷</span>
          </h1>
          <p className="mt-3 max-w-md text-base text-muted-foreground md:text-lg">
            Your soft little corner of the internet — everything for school in one place.
          </p>
        </header>

        {/* Search */}
        <form onSubmit={handleSearch} className="mx-auto mb-12 max-w-2xl">
          <label htmlFor="search" className="sr-only">
            Search the web
          </label>
          <div className="glass flex items-center gap-3 rounded-full border border-white/70 px-5 py-3 shadow-[var(--shadow-card)] transition-all focus-within:shadow-[var(--shadow-glow)]">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              id="search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Google or type a URL..."
              className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
              autoFocus
            />
            <button
              type="submit"
              className="rounded-full bg-[hsl(var(--pastel-lavender))] px-4 py-1.5 text-sm font-semibold text-[hsl(280_50%_25%)] transition-transform hover:scale-105 active:scale-95"
            >
              Go
            </button>
          </div>
        </form>

        {/* Tile sections */}
        <section className="space-y-10" aria-label="Quick links">
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <h2 className="mb-4 px-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {cat}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {TILES.filter((t) => t.category === cat).map((tile) => (
                  <a
                    key={tile.name}
                    href={tile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tile-hover glass group flex flex-col items-center justify-center gap-3 rounded-3xl border border-white/70 p-5 shadow-[var(--shadow-card)]"
                  >
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colorMap[tile.color]} shadow-inner`}
                    >
                      <tile.Icon className="h-7 w-7 text-foreground/75" />
                    </div>
                    <span className="text-sm font-semibold text-foreground/85">
                      {tile.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </section>

        <footer className="mt-16 text-center text-xs text-muted-foreground/80">
          made with 🌸 · set this page as your browser homepage to bloom every morning
        </footer>
      </div>
    </main>
  );
};

export default Index;
