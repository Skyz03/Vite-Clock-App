import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import {
  RefreshCw,
  ArrowDown,
  ArrowUp,
  Sun,
  Moon,
  MapPin
} from 'lucide-react';

/* ================= TYPES ================= */

interface ClockData {
  time: string;
  location: string;
  timezone: string;
  timezoneAbbr: string;
  dayOfYear: number;
  dayOfWeek: number;
  weekNumber: number;
  currentHour: number;
  rawTime: Date;
}

interface Quote {
  content: string;
  author: string;
}

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

/* ================= LAYOUT ================= */

const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-16">
    {children}
  </div>
);

/* ================= APP ================= */

export default function App() {
  const [data, setData] = useState<ClockData | null>(null);
  const [quote, setQuote] = useState<Quote>({ content: '', author: '' });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { speak } = useVoiceAssistant();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const safeSpeak = (text: string, onEnd?: () => void) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    speak(text, () => {
      setIsSpeaking(false);
      onEnd?.();
    });
  };

  const refreshQuote = async () => {
    try {
      const res = await axios.get('https://api.quotable.io/random');
      setQuote({ content: res.data.content, author: res.data.author });
    } catch { }
  };

  /* ================= INIT ================= */

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const now = new Date();

      let newData: ClockData = {
        time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        location: 'Local System',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneAbbr: 'LOC',
        dayOfYear: 0,
        dayOfWeek: now.getDay(),
        weekNumber: 0,
        currentHour: now.getHours(),
        rawTime: now
      };

      try {
        await refreshQuote();
        const [geo, time] = await Promise.all([
          axios.get('https://ipapi.co/json/', { timeout: 3000 }),
          axios.get('https://worldtimeapi.org/api/ip', { timeout: 3000 })
        ]);

        newData = {
          ...newData,
          location: `${geo.data.city}, ${geo.data.country_name}`,
          timezone: time.data.timezone,
          timezoneAbbr: time.data.abbreviation,
          dayOfYear: time.data.day_of_year,
          dayOfWeek: time.data.day_of_week,
          weekNumber: time.data.week_number
        };
      } catch {
        console.log('Offline mode');
      } finally {
        setData(newData);
        setIsLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!hasInitialized) return;
    const timer = setInterval(() => {
      const now = new Date();
      setData(prev =>
        prev
          ? {
            ...prev,
            time: now.toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            currentHour: now.getHours(),
            rawTime: now
          }
          : null
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [hasInitialized]);

  const isNightMode = useMemo(() => {
    if (!data) return false;
    return data.currentHour >= 18 || data.currentHour < 6;
  }, [data]);

  /* ================= VOICE FLOW ================= */

  const handleStart = () => {
    setHasInitialized(true);
    if (!data) return;

    const greeting =
      data.location === 'Local System'
        ? 'Hello Chief. External services unavailable. Initializing local time.'
        : `Hello Chief. You are in ${data.location}. Is this correct?`;

    safeSpeak(greeting, () => {
      if (data.location !== 'Local System') setShowLocationConfirm(true);
    });
  };

  const handleLocationConfirm = (ok: boolean) => {
    setShowLocationConfirm(false);
    if (ok && data) {
      safeSpeak(`System synchronized. The time is ${data.rawTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric'
      })}.`);
    } else {
      safeSpeak('Proceeding with manual override.');
    }
  };

  /* ================= BACKGROUND ================= */

  const bgImage = isNightMode
    ? 'bg-[url("https://images.unsplash.com/photo-1472552947727-3393002e0b39?q=80&w=2070&auto=format&fit=crop")]'
    : 'bg-[url("https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=2070&auto=format&fit=crop")]';

  if (isLoading || !data) {
    return (
      <div className="h-screen w-full bg-black text-white flex items-center justify-center font-mono animate-pulse">
        Initializing Systems…
      </div>
    );
  }

  /* ================= START SCREEN ================= */

  if (!hasInitialized) {
    return (
      <main className="h-screen w-full bg-black flex items-center justify-center">
        <div className="text-center space-y-10">
          <h1 className="text-6xl md:text-8xl font-black tracking-tight text-white">
            CLOCK OS
          </h1>
          <button
            onClick={handleStart}
            className="px-10 py-4 bg-white text-black font-bold tracking-widest rounded-full hover:scale-105 active:scale-95 transition"
          >
            INITIALIZE
          </button>
        </div>
      </main>
    );
  }

  /* ================= MAIN UI ================= */

  return (
    <main className={`relative h-screen w-full bg-cover bg-center ${bgImage}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />

      {/* LOCATION CONFIRM */}
      {showLocationConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl">
          <div className="bg-black/80 rounded-3xl p-12 text-center space-y-8">
            <MapPin size={48} className="mx-auto text-blue-400" />
            <h3 className="text-3xl font-black text-white">{data.location}</h3>
            <div className="flex gap-6">
              <button
                onClick={() => handleLocationConfirm(true)}
                className="flex-1 py-4 bg-white text-black font-bold rounded-xl"
              >
                Confirm
              </button>
              <button
                onClick={() => handleLocationConfirm(false)}
                className="flex-1 py-4 border border-white/20 text-white font-bold rounded-xl"
              >
                Incorrect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div
        className={`relative z-10 h-full transition-transform duration-1000 ${isExpanded ? '-translate-y-[40vh]' : ''
          }`}
      >
        <Container>
          {/* QUOTE */}
          <header
            className={`pt-20 max-w-5xl transition-all duration-700 ${isExpanded ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100'
              }`}
          >
            <div className="flex flex-wrap items-center gap-6 group">
              {/* Quote Text */}
              <p className="border-l-2 border-white/20 pl-6 italic text-lg md:text-xl text-white/90 leading-none">
                {quote.content ? `“${quote.content}”` : "Time flies like an arrow; fruit flies like a banana."}
              </p>

              {/* Metadata Wrapper: Author + Refresh */}
              <div className="flex items-center gap-4 shrink-0">
                <span className="uppercase tracking-[0.3em] text-[10px] font-black text-white/40">
        // {quote.author || "Skyz"}
                </span>

                <button
                  onClick={refreshQuote}
                  className="p-2 rounded-full hover:bg-white/10 text-white/20 hover:text-white transition-all active:rotate-180 duration-500"
                  title="Refresh Neural Uplink"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          </header>

          {/* FOOTER */}
          <footer className="mt-36 pb-16 flex flex-col gap-14 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-12">
              <div className="flex items-center gap-4 uppercase tracking-[0.3em] text-sm text-white/70">
                {isNightMode ? <Moon size={18} /> : <Sun size={18} />}
                Good {data.currentHour < 12 ? 'Morning' : data.currentHour < 18 ? 'Afternoon' : 'Evening'}, Chief
              </div>

              <div className="flex items-baseline gap-6">
                <h1 className="font-black text-white leading-[0.85] tracking-tight text-[clamp(5rem,18vw,14rem)]">
                  {data.time.slice(0, 2)}
                </h1>
                <div className="space-y-2">
                  <div className="text-4xl font-light text-white/30">{data.timezoneAbbr}</div>
                  <div className="text-sm font-bold text-white/50">{data.time.slice(-2)}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 uppercase tracking-[0.3em] text-sm text-white/60">
                <MapPin size={14} />
                {data.location}
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-6 bg-white py-3 pl-10 pr-3 rounded-full font-black tracking-[0.35em] text-xs text-black"
            >
              {isExpanded ? 'MINIMIZE' : 'DETAILS'}
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white">
                {isExpanded ? <ArrowUp /> : <ArrowDown />}
              </div>
            </button>
          </footer>
        </Container>
      </div>

      {/* STATS PANEL */}
      <div
        className={`absolute bottom-0 left-0 w-full h-[45vh] transition-transform duration-1000 ${isExpanded ? 'translate-y-0' : 'translate-y-full'
          } ${isNightMode ? 'bg-black/80 text-white' : 'bg-white/90 text-black'} backdrop-blur-3xl`}
      >
        <Container>
          <div className="h-full py-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-16 gap-x-20 items-center">
            <StatBox label="Timezone" value={data.timezone} />
            <StatBox label="Day of Year" value={data.dayOfYear} />
            <StatBox label="Day" value={DAY_NAMES[data.dayOfWeek]} />
            <StatBox label="Week" value={data.weekNumber} />
          </div>
        </Container>
      </div>
    </main>
  );
}

/* ================= STAT ================= */

const StatBox = ({ label, value }: { label: string; value: string | number }) => (
  <div className="space-y-4">
    <span className="uppercase tracking-[0.3em] text-xs opacity-50">{label}</span>
    <div className="text-5xl font-black tracking-tight truncate">{value}</div>
    <div className="h-px w-12 bg-current opacity-30" />
  </div>
);
