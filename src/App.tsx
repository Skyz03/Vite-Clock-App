import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import {
  RefreshCw,
  ArrowDown,
  ArrowUp,
  Sun,
  Moon,
  MapPin,
  Cpu
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// Assets
import bgImageDaytime from './assets/desktop/bg-image-daytime.jpg';
import bgImageNighttime from './assets/desktop/bg-image-nighttime.jpg';
// @ts-ignore
import localQuotes from './data/quote.js';

/* ================= UTILITY FUNCTIONS ================= */

// Calculate day of year (1-365/366)
const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// Calculate ISO week number (1-52/53)
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

/* ================= DATA FETCHING (Outside Component) ================= */

const fetchSystemUplink = async () => {
  const [geo, time] = await Promise.all([
    axios.get('https://free.freeipapi.com/api/json/', { timeout: 4000 }),
    axios.get('https://worldtimeapi.org/api/ip', { timeout: 4000 })
  ]);
  
  return {
    location: `${geo.data.cityName}, ${geo.data.countryName}`,
    timezone: time.data.timezone,
    timezoneAbbr: time.data.abbreviation,
    dayOfYear: time.data.day_of_year,
    dayOfWeek: time.data.day_of_week,
    weekNumber: time.data.week_number
  };
};

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

/* ================= COMPONENTS ================= */

const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-16">
    {children}
  </div>
);

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

/* ================= MAIN APP ================= */

export default function App() {
  // 1. TanStack Query Hook
  // This replaces your entire "init" useEffect and manual axios calls
  const { data: serverData, isPending: isUplinkLoading } = useQuery({
    queryKey: ['systemUplink'],
    queryFn: fetchSystemUplink,
    staleTime: 1000 * 60 * 60, // Consider data "fresh" for 1 hour
    refetchOnWindowFocus: true, // Auto-update when user returns to tab
  });

  // 2. Local Time State (Updates every second)
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Merged Data Object
  // We use useMemo to combine Server Data with our Local Clock
  const data: ClockData = useMemo(() => {
    const fallbackLocation = {
      location: 'Local System',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneAbbr: 'LOC',
    };

    const baseData = serverData || fallbackLocation;

    // Always calculate date-based values from local time for accuracy
    return {
      ...baseData,
      dayOfYear: getDayOfYear(currentTime),
      dayOfWeek: currentTime.getDay(),
      weekNumber: getWeekNumber(currentTime),
      time: currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      currentHour: currentTime.getHours(),
      rawTime: currentTime
    };
  }, [serverData, currentTime]);

  const [quote, setQuote] = useState<Quote>({ content: '', author: '' });
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Engagement States
  const [parallax, setParallax] = useState({ x: 0, y: 0, rotX: 0, rotY: 0 });
  const { speak } = useVoiceAssistant();

  // 4. Update the "isLoading" check
  // isUplinkLoading is true only on the very first boot
  const isLoading = isUplinkLoading && !hasInitialized;

  /* 1. HAPTIC FEEDBACK ENGINE */
  const triggerHaptic = useCallback((intensity: 'light' | 'medium' | 'heavy') => {
    if (!('vibrate' in navigator)) return;
    const patterns = {
      light: 10,
      medium: [20, 30, 20],
      heavy: [50, 100, 50]
    };
    navigator.vibrate(patterns[intensity]);
  }, []);

  /* 2. DEVICE ORIENTATION LOGIC */
  const handleOrientation = (e: DeviceOrientationEvent) => {
    const x = e.gamma ? (e.gamma / 12) : 0; // Left/Right tilt
    const y = e.beta ? (e.beta - 45) / 12 : 0; // Front/Back tilt (offset for natural holding angle)

    setParallax({
      x: x * -1.5,
      y: y * -1.5,
      rotX: y * 0.8,
      rotY: x * -0.8
    });
  };

  const requestSensors = async () => {
    triggerHaptic('medium');

    // iOS 13+ Permission Request
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
        }
      } catch (e) {
        console.error("Sensor access denied");
      }
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    handleStart();
  };

  /* 3. VOICE & DATA LOGIC */
  const safeSpeak = (text: string, onEnd?: () => void) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    speak(text, () => {
      setIsSpeaking(false);
      onEnd?.();
    });
  };

  const refreshQuote = () => {
    triggerHaptic('light');
    const randomIndex = Math.floor(Math.random() * localQuotes.length);
    const selectedQuote = localQuotes[randomIndex];
    setQuote({
      content: selectedQuote.content,
      author: selectedQuote.author
    });
  };

  // Initialize quote on mount
  useEffect(() => {
    refreshQuote();
  }, []);

  const isNightMode = useMemo(() => {
    if (!data) return false;
    return data.currentHour >= 18 || data.currentHour < 6;
  }, [data]);

  const currentBg = isNightMode ? bgImageNighttime : bgImageDaytime;

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
    triggerHaptic(ok ? 'medium' : 'light');
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

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-black text-white flex flex-col items-center justify-center font-mono animate-pulse gap-4">
        <Cpu className="animate-spin text-blue-500" size={32} />
        <span className="tracking-[0.5em] text-xs">BOOTING OS...</span>
      </div>
    );
  }

  /* ================= START SCREEN ================= */

  if (!hasInitialized) {
    return (
      <main
        className="relative h-screen w-full bg-cover bg-center flex flex-col items-center justify-center px-6 overflow-hidden"
        style={{ backgroundImage: `url(${currentBg})` }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative z-10 text-center space-y-10">
          <div className="space-y-2">
            <p className="text-blue-400 font-mono text-xs tracking-[0.4em]">SYSTEM v2.0</p>
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white drop-shadow-2xl">
              CLOCK OS
            </h1>
          </div>
          <button
            onClick={requestSensors}
            className="group relative px-12 py-5 bg-white text-black font-bold tracking-[0.3em] rounded-full hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] uppercase text-xs"
          >
            <span className="relative z-10">Initialize Neural Link</span>
            <div className="absolute inset-0 rounded-full bg-blue-500 scale-0 group-hover:scale-110 opacity-0 group-hover:opacity-20 transition-all duration-500" />
          </button>
        </div>
      </main>
    );
  }

  /* ================= MAIN UI ================= */

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black font-sans perspective-[1200px]">

      {/* 1. PHYSICAL BACKGROUND LAYER (3D TILT) */}
      <div
        style={{
          backgroundImage: `url(${currentBg})`,
          transform: `
            translate3d(${parallax.x}px, ${parallax.y}px, -50px) 
            rotateX(${parallax.rotX}deg) 
            rotateY(${parallax.rotY}deg)
            scale(1.2)
          `,
        }}
        className={`absolute inset-0 bg-cover bg-center transition-transform duration-[150ms] ease-out will-change-transform ${isExpanded ? 'blur-md brightness-50' : 'blur-0'
          }`}
      />

      {/* 2. ATMOSPHERIC OVERLAYS */}
      <div className="absolute inset-0 bg-black/20 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

      {/* 3. LOCATION CONFIRM MODAL */}
      {showLocationConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xl p-6">
          <div className="bg-black/80 border border-white/10 rounded-3xl p-8 md:p-12 text-center space-y-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
            <div className="relative">
              <MapPin size={48} className="mx-auto text-blue-400 animate-bounce" />
              <div className="absolute inset-0 bg-blue-400/20 blur-2xl rounded-full" />
            </div>
            <div className="space-y-2">
              <p className="text-white/40 uppercase tracking-[0.3em] text-[10px]">Satellite Uplink Success</p>
              <h3 className="text-3xl font-black text-white uppercase">{data.location}</h3>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => handleLocationConfirm(true)}
                className="flex-1 py-4 bg-white text-black font-bold rounded-xl hover:bg-blue-500 hover:text-white transition-all transform active:scale-95"
              >
                Confirm
              </button>
              <button
                onClick={() => handleLocationConfirm(false)}
                className="flex-1 py-4 border border-white/20 text-white font-bold rounded-xl hover:bg-white/5 transition-colors"
              >
                Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. FLOATING CONTENT LAYER */}
      <div
        className={`relative z-10 h-full transition-all duration-[1000ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${isExpanded ? '-translate-y-[40vh] md:-translate-y-[45vh]' : 'translate-y-0'
          }`}
      >
        <Container>
          <div className="flex flex-col justify-between h-screen py-10 md:py-16 lg:py-20">

            {/* HEADER (Floating Quote) */}
            <header className={`transition-all duration-700 ${isExpanded ? 'opacity-0 -translate-y-20 scale-95 pointer-events-none' : 'opacity-100'}`}>
              <div className="flex flex-col gap-3 max-w-2xl bg-black/10 backdrop-blur-md p-6 rounded-2xl border border-white/5">
                <div className="flex items-start gap-4">
                  <p className="text-white text-base md:text-lg leading-relaxed font-normal italic">
                    {quote.content ? `“${quote.content}”` : "Uplink active..."}
                  </p>
                  <button onClick={refreshQuote} className="mt-1 text-white/40 hover:text-white hover:rotate-180 transition-all duration-500">
                    <RefreshCw size={18} />
                  </button>
                </div>
                <span className="text-white font-bold text-sm tracking-widest uppercase opacity-90 border-l-2 border-blue-500 pl-3">
                  {quote.author || "System"}
                </span>
              </div>
            </header>

            {/* FOOTER (Main Display) */}
            <footer className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-4 uppercase tracking-[0.3em] text-sm md:text-base font-medium text-white drop-shadow-md">
                  {isNightMode ? <Moon className="text-blue-300" size={24} /> : <Sun className="text-yellow-400" size={24} />}
                  <span>Good {data.currentHour < 12 ? 'Morning' : data.currentHour < 18 ? 'Afternoon' : 'Evening'}</span>
                  <span className="hidden md:inline">, Chief</span>
                </div>

                <div className="flex items-baseline gap-2 md:gap-4">
                  <h1 className="font-bold text-white leading-none tracking-tighter text-[90px] md:text-[160px] lg:text-[200px] drop-shadow-2xl">
                    {data.time}
                  </h1>
                  <span className="text-2xl md:text-4xl lg:text-5xl font-light text-white/70 uppercase tracking-widest">
                    {data.timezoneAbbr}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-white text-lg md:text-2xl font-bold uppercase tracking-[0.25em]">
                  <MapPin size={20} className="text-blue-400" />
                  {data.location}
                </div>
              </div>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsExpanded(!isExpanded);
                }}
                className="group flex items-center gap-4 bg-white hover:bg-blue-500 p-2 pl-6 md:pl-8 rounded-full transition-all self-start lg:mb-6 shadow-xl active:scale-90"
              >
                <span className="font-bold tracking-[0.3em] text-xs text-black/60 group-hover:text-white transition-colors">
                  {isExpanded ? 'LESS' : 'MORE'}
                </span>
                <div className="w-8 h-8 md:w-10 md:h-10 bg-black group-hover:bg-white group-hover:text-black rounded-full flex items-center justify-center text-white transition-transform">
                  {isExpanded ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                </div>
              </button>
            </footer>
          </div>
        </Container>
      </div>

      {/* 5. STATS PANEL - Frosted Glass */}
      <div
        className={`absolute bottom-0 left-0 w-full h-[40vh] md:h-[45vh] transition-transform duration-[1000ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${isExpanded ? 'translate-y-0' : 'translate-y-full'
          } z-20`}
      >
        <div className={`absolute inset-0 backdrop-blur-3xl border-t border-white/10 ${isNightMode ? 'bg-black/80' : 'bg-white/70'
          }`} />

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