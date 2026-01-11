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

// Import your assets
import bgImageDaytime from './assets/desktop/bg-image-daytime.jpg';
import bgImageNighttime from './assets/desktop/bg-image-nighttime.jpg';
// @ts-ignore
import localQuotes from './data/quote.js';

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

  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // Gamma is left-to-right tilt (-90 to 90)
      // Beta is front-to-back tilt (-180 to 180)
      const x = e.gamma ? (e.gamma / 15) : 0;
      const y = e.beta ? (e.beta - 45) / 15 : 0; // Subtracting 45 assumes the user holds the phone at an angle

      setParallax({ x, y });
    };

    // Check if the browser requires permission (iOS requirement)
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      // We will trigger this on the "INITIALIZE" button click later
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  const safeSpeak = (text: string, onEnd?: () => void) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    speak(text, () => {
      setIsSpeaking(false);
      onEnd?.();
    });
  };

  const refreshQuote = () => {
    const randomIndex = Math.floor(Math.random() * localQuotes.length);
    const selectedQuote = localQuotes[randomIndex];
    setQuote({
      content: selectedQuote.content,
      author: selectedQuote.author
    });
  };

  /* ================= INIT ================= */

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const now = new Date();
      refreshQuote();

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
        const [geo, time] = await Promise.all([
          axios.get('https://free.freeipapi.com/api/json/', { timeout: 3000 }),
          axios.get('https://worldtimeapi.org/api/ip', { timeout: 3000 })
        ]);

        newData = {
          ...newData,
          location: `${geo.data.cityName}, ${geo.data.countryName}`,
          timezone: time.data.timezone,
          timezoneAbbr: time.data.abbreviation,
          dayOfYear: time.data.day_of_year,
          dayOfWeek: time.data.day_of_week,
          weekNumber: time.data.week_number
        };
      } catch (error) {
        console.error('⚠️ Uplink Offline:', error);
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
      setData(prev => prev ? {
        ...prev,
        time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        currentHour: now.getHours(),
        rawTime: now
      } : null);
    }, 1000);
    return () => clearInterval(timer);
  }, [hasInitialized]);



  const isNightMode = useMemo(() => {
    if (!data) return false;
    return data.currentHour >= 18 || data.currentHour < 6;
  }, [data]);

  const currentBg = isNightMode ? bgImageNighttime : bgImageDaytime;

  /* ================= VOICE FLOW ================= */

  const handleStart = () => {
    setHasInitialized(true);
    if (!data) return;

    const greeting = data.location === 'Local System'
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
      <main
        className="relative h-screen w-full bg-cover bg-center transition-all duration-[2000ms] scale-110 flex flex-col items-center justify-center px-6"
        style={{ backgroundImage: `url(${currentBg})` }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center space-y-10">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-2xl">
            CLOCK OS
          </h1>
          <button
            onClick={handleStart}
            className="px-12 py-5 bg-white text-black font-bold tracking-[0.3em] rounded-full hover:scale-105 active:scale-95 transition-all shadow-2xl uppercase text-xs"
          >
            Initialize
          </button>
        </div>
      </main>
    );
  }

  /* ================= MAIN UI ================= */

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black font-sans">

      {/* 1. BACKGROUND LAYER - Fixed with Parallax Scale & Blur */}
      <div
        data-testid="bg-container"
        className={`absolute inset-0 bg-cover bg-center transition-transform duration-75 ease-out ${isExpanded ? 'scale-125 blur-sm' : 'scale-110 blur-0'
          }`}
        style={{
          backgroundImage: `url(${currentBg})`,
          transform: `translate(${parallax.x}px, ${parallax.y}px)` // Apply the tilt here
        }}
      />

      {/* 2. OVERLAY LAYER */}
      <div className="absolute inset-0 bg-black/30 bg-gradient-to-b from-black/20 via-transparent to-black/70" />

      {/* 3. LOCATION CONFIRM MODAL */}
      {showLocationConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-6">
          <div className="bg-black/80 border border-white/10 rounded-3xl p-8 md:p-12 text-center space-y-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-300">
            <MapPin size={48} className="mx-auto text-blue-400" />
            <div className="space-y-2">
              <p className="text-white/40 uppercase tracking-[0.3em] text-[10px]">Detected Uplink</p>
              <h3 className="text-3xl font-black text-white uppercase">{data.location}</h3>
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
                Manual
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CONTENT LAYER */}
      <div
        className={`relative z-10 h-full transition-all duration-[1000ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${isExpanded ? '-translate-y-[40vh] md:-translate-y-[45vh]' : 'translate-y-0'
          }`}
      >
        <Container>
          <div className="flex flex-col justify-between h-screen py-10 md:py-16 lg:py-20">

            {/* HEADER (Quote) */}
            <header className={`transition-all duration-500 ${isExpanded ? 'opacity-0 -translate-y-10 pointer-events-none' : 'opacity-100'}`}>
              <div className="flex flex-col gap-3 max-w-2xl">
                <div className="flex items-start gap-4">
                  <p className="text-white text-base md:text-lg leading-relaxed font-normal">
                    {quote.content ? `“${quote.content}”` : "Uplink active..."}
                  </p>
                  <button onClick={refreshQuote} className="mt-1 text-white/40 hover:text-white transition-colors">
                    <RefreshCw size={18} />
                  </button>
                </div>
                <span className="text-white font-bold text-sm tracking-widest uppercase opacity-90">
                  {quote.author || "System"}
                </span>
              </div>
            </header>

            {/* FOOTER (Clock Area) */}
            <footer className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4 md:space-y-6">
                {/* Greeting */}
                <div className="flex items-center gap-4 uppercase tracking-[0.3em] text-sm md:text-base font-medium text-white">
                  {isNightMode ? <Moon size={24} /> : <Sun size={24} />}
                  <span>Good {data.currentHour < 12 ? 'Morning' : data.currentHour < 18 ? 'Afternoon' : 'Evening'}</span>
                  <span className="hidden md:inline">, it's currently</span>
                </div>

                {/* Massive Time Display */}
                <div className="flex items-baseline gap-2 md:gap-4">
                  <h1 className="font-bold text-white leading-none tracking-tighter text-[100px] md:text-[160px] lg:text-[200px]">
                    {data.time}
                  </h1>
                  <span className="text-2xl md:text-4xl lg:text-5xl font-light text-white uppercase tracking-widest">
                    {data.timezoneAbbr}
                  </span>
                </div>

                {/* Location */}
                <div className="text-white text-lg md:text-2xl font-bold uppercase tracking-[0.25em]">
                  In {data.location}
                </div>
              </div>

              {/* Toggle Button */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="group flex items-center gap-4 bg-white hover:bg-white/90 p-2 pl-6 md:pl-8 rounded-full transition-all self-start lg:mb-6"
              >
                <span className="font-bold tracking-[0.3em] text-xs text-black/50 group-hover:text-black transition-colors">
                  {isExpanded ? 'LESS' : 'MORE'}
                </span>
                <div className="w-8 h-8 md:w-10 md:h-10 bg-[#303030] group-hover:bg-black rounded-full flex items-center justify-center text-white transition-transform">
                  {isExpanded ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                </div>
              </button>
            </footer>
          </div>
        </Container>
      </div>

      {/* 5. STATS PANEL - Glassmorphism */}
      <div
        className={`absolute bottom-0 left-0 w-full h-[40vh] md:h-[45vh] transition-transform duration-[1000ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${isExpanded ? 'translate-y-0' : 'translate-y-full'
          } z-20`}
      >
        {/* Backdrop glass layer */}
        <div className={`absolute inset-0 backdrop-blur-3xl ${isNightMode ? 'bg-black/75' : 'bg-white/80'
          }`} />

        {/* Vertical visual divider for desktop */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-1/2 hidden lg:block ${isNightMode ? 'bg-white/10' : 'bg-black/10'
          }`} />

        <Container>
          <div className="relative h-full py-16 grid grid-cols-1 md:grid-cols-2 gap-y-8 md:gap-y-12 lg:gap-x-24 items-center">
            <StatBox label="Current Timezone" value={data.timezone} isNight={isNightMode} />
            <StatBox label="Day of the week" value={data.dayOfWeek} isNight={isNightMode} />
            <StatBox label="Day of the year" value={data.dayOfYear} isNight={isNightMode} />
            <StatBox label="Week number" value={data.weekNumber} isNight={isNightMode} />
          </div>
        </Container>
      </div>
    </main>
  );
}

/* ================= STAT BOX COMPONENT ================= */

const StatBox = ({ label, value, isNight }: { label: string; value: string | number; isNight: boolean }) => (
  <div className="flex md:flex-col justify-between items-center md:items-start gap-1">
    <span className={`uppercase tracking-[0.2em] text-[10px] md:text-xs font-bold ${isNight ? 'text-white/60' : 'text-black/60'}`}>
      {label}
    </span>
    <div className={`text-2xl md:text-4xl lg:text-6xl font-bold tracking-tight ${isNight ? 'text-white' : 'text-black'}`}>
      {value}
    </div>
  </div>
);