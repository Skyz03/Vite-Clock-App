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

  /* ================= MAIN UI ================= */

  return (
    <main className={`relative h-screen w-full bg-cover bg-center overflow-hidden ${bgImage}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />

      {/* LOCATION CONFIRM MODAL (Remains the same) */}
      {showLocationConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-6">
          <div className="bg-black/80 border border-white/10 rounded-3xl p-8 md:p-12 text-center space-y-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-300">
            <MapPin size={48} className="mx-auto text-blue-400" />
            <div className="space-y-2">
              <p className="text-white/40 uppercase tracking-[0.3em] text-[10px]">Detected Uplink</p>
              <h3 className="text-3xl font-black text-white">{data.location}</h3>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => handleLocationConfirm(true)}
                className="flex-1 py-4 bg-white text-black font-bold rounded-xl hover:bg-blue-400 hover:text-white transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => handleLocationConfirm(false)}
                className="flex-1 py-4 border border-white/20 text-white font-bold rounded-xl hover:bg-white/5 transition-colors"
              >
                Incorrect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div
        className={`relative z-10 h-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] ${isExpanded ? '-translate-y-[45vh]' : 'translate-y-0'
          }`}
      >
        <Container>
          {/* We use a flex container that spans the full height of the viewport */}
          <div className="flex flex-col justify-between h-screen py-12 md:py-20 lg:py-24">

            {/* HEADER (Top Spaced) */}
            <header
              className={`transition-all duration-700 ${isExpanded ? 'opacity-0 -translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'
                }`}
            >
              <div className="flex flex-wrap items-center gap-6 group max-w-4xl">
                <p className="border-l-2 border-white/20 pl-6 italic text-lg md:text-xl text-white/90 leading-relaxed">
                  {quote.content ? `“${quote.content}”` : "Time flies like an arrow; fruit flies like a banana."}
                </p>

                <div className="flex items-center gap-4 shrink-0 pl-6 md:pl-0">
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

            {/* FOOTER (Bottom Spaced) */}
            <footer className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-8 md:space-y-12">
                {/* Greeting */}
                <div className="flex items-center gap-4 uppercase tracking-[0.4em] text-[10px] md:text-xs font-bold text-white/70">
                  <span className="p-2 bg-white/10 rounded-md">
                    {isNightMode ? <Moon size={16} /> : <Sun size={16} />}
                  </span>
                  Good {data.currentHour < 12 ? 'Morning' : data.currentHour < 18 ? 'Afternoon' : 'Evening'}, Chief
                </div>

                {/* Massive Time Display */}
                <div className="flex items-baseline gap-4 md:gap-6">
                  <h1 className="font-black text-white leading-[0.8] tracking-tighter text-[clamp(5rem,20vw,16rem)] drop-shadow-2xl">
                    {data.time.slice(0, 2)}
                  </h1>
                  <div className="flex flex-col gap-1 md:gap-2">
                    <div className="text-3xl md:text-5xl font-extralight text-white/30 tracking-tighter">{data.timezoneAbbr}</div>
                    <div className="text-xs md:text-sm font-black text-white/50 pl-1">{data.time.slice(-2)}</div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-3 uppercase tracking-[0.5em] text-[10px] md:text-xs font-black text-white/60 pl-1">
                  <MapPin size={12} className="text-blue-400" />
                  {data.location}
                </div>
              </div>

              {/* Toggle Button */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="group self-start lg:self-end flex items-center gap-6 bg-white py-2 pl-8 pr-2 rounded-full transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95"
              >
                <span className="font-black tracking-[0.3em] text-[10px] text-black">
                  {isExpanded ? 'MINIMIZE' : 'DETAILS'}
                </span>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-full flex items-center justify-center text-white transition-transform group-hover:bg-blue-600">
                  {isExpanded ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                </div>
              </button>
            </footer>
          </div>
        </Container>
      </div>

      {/* STATS PANEL (Slide Up) */}
      <div
        className={`absolute bottom-0 left-0 w-full h-[50vh] transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] ${isExpanded ? 'translate-y-0' : 'translate-y-full'
          } ${isNightMode ? 'bg-black/80 text-white' : 'bg-white/95 text-black'} backdrop-blur-3xl border-t border-white/10 z-20`}
      >
        <Container>
          <div className="h-full py-12 md:py-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-12 lg:gap-x-20 items-center">
            <StatBox label="Timezone" value={data.timezone} />
            <StatBox label="Day of Year" value={data.dayOfYear} />
            <StatBox label="Day of Week" value={DAY_NAMES[data.dayOfWeek]} />
            <StatBox label="Current Week" value={data.weekNumber} />
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
