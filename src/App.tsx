import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { RefreshCw, ArrowDown, ArrowUp, Sun, Moon, MapPin } from 'lucide-react';

// Types remain the same...
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

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function App() {
  const [data, setData] = useState<ClockData | null>(null);
  const [quote, setQuote] = useState<Quote>({ content: '', author: '' });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Voice + flow state
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
      const qRes = await axios.get('https://api.quotable.io/random');
      setQuote({ content: qRes.data.content, author: qRes.data.author });
    } catch {
      // Fallback logic
    }
  };

  useEffect(() => {
    const initData = async () => {
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
      } catch (e) {
        console.log("Using offline mode");
      } finally {
        setData(newData);
        setIsLoading(false);
      }
    };

    initData();
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
    if (data?.currentHour === undefined) return false;
    return data.currentHour >= 18 || data.currentHour < 6;
  }, [data?.currentHour]);

  const handleStartExperience = () => {
    setHasInitialized(true);
    if (!data) return;
    const greeting = data.location === 'Local System'
      ? 'Hello Chief. External location services are offline. Initializing local system time.'
      : `Hello Chief. We detected you are in ${data.location}. Is this correct?`;

    safeSpeak(greeting, () => {
      if (data.location !== 'Local System') setShowLocationConfirm(true);
    });
  };

  const handleLocationConfirm = (correct: boolean) => {
    setShowLocationConfirm(false);
    if (correct && data) {
      const timeSpeech = data.rawTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
      safeSpeak(`Excellent. System synchronized. The time is ${timeSpeech}.`);
    } else {
      safeSpeak('Understood. Proceeding with manual override.');
    }
  };

  // --- Background Selection ---
  const bgImage = isNightMode
    ? 'bg-[url("https://images.unsplash.com/photo-1472552947727-3393002e0b39?q=80&w=2070&auto=format&fit=crop")]'
    : 'bg-[url("https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=2070&auto=format&fit=crop")]';

  if (isLoading || !data) {
    return <div className="h-screen w-full bg-black text-white flex items-center justify-center font-mono animate-pulse">Initializing Systems...</div>;
  }

  // --- Start Screen ---
  if (!hasInitialized) {
    return (
      <main className="h-screen w-full bg-black relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 to-black"></div>
        <div className="z-10 text-center space-y-8 animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white">CLOCK OS</h1>
            <p className="text-gray-400 uppercase tracking-[0.5em] text-sm">System Ready</p>
          </div>
          <button
            onClick={handleStartExperience}
            className="group relative px-8 py-4 bg-white text-black font-bold tracking-widest rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
          >
            <span className="relative z-10">INITIALIZE INTERFACE</span>
            <div className="absolute inset-0 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ease-out -z-0 opacity-20"></div>
          </button>
        </div>
      </main>
    );
  }

  // --- Main App ---
  return (
    <main className={`relative h-screen w-full bg-cover bg-center transition-all duration-1000 overflow-hidden font-sans ${bgImage}`}>
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

      {/* Voice Confirmation Modal */}
      {showLocationConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel p-8 rounded-2xl text-center space-y-6 max-w-sm mx-4">
            <div className="flex justify-center text-blue-400 mb-4"><MapPin size={48} /></div>
            <div className="space-y-2">
              <p className="text-gray-300 text-sm uppercase tracking-widest">Detected Location</p>
              <h3 className="text-2xl font-bold text-white">{data.location}</h3>
            </div>
            <div className="flex gap-4 justify-center">
              <button onClick={() => handleLocationConfirm(true)} className="px-6 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-full transition-colors">Confirm</button>
              <button onClick={() => handleLocationConfirm(false)} className="px-6 py-2 border border-white/30 hover:bg-white/10 text-white rounded-full transition-colors">Incorrect</button>
            </div>
          </div>
        </div>
      )}

      {/* Content Container */}
      <div className={`relative z-10 h-full flex flex-col justify-between transition-all duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${isExpanded ? '-translate-y-[45vh]' : 'translate-y-0'}`}>

        {/* Top: Quote */}
        <div className={`p-8 md:p-16 max-w-2xl transition-opacity duration-500 ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex gap-4 items-start group">
            <div className="space-y-4">
              <p className="text-lg md:text-xl leading-relaxed text-white/90">"{quote.content}"</p>
              <p className="font-bold text-white text-base md:text-lg">{quote.author}</p>
            </div>
            <button onClick={refreshQuote} className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-white/50 hover:text-white">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Bottom: Clock & Toggle */}
        <div className="px-8 md:px-16 pb-16 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">

          {/* Clock Block */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-white uppercase tracking-[0.2em] text-sm md:text-xl font-light">
              {isNightMode ? <Moon size={24} /> : <Sun size={24} />}
              <span>Good {data.currentHour < 12 ? 'Morning' : data.currentHour < 18 ? 'Afternoon' : 'Evening'}, It's Currently</span>
            </div>

            <div className="flex items-baseline gap-4 md:gap-8">
              <h1 className="text-[15vw] md:text-[12rem] font-bold text-white leading-none tracking-tighter">
                {data.time.replace(/:\d{2}$/, '')} <span className="text-2xl md:text-6xl font-light text-white/50 hidden md:inline">{data.time.slice(-2)}</span>
              </h1>
              <span className="text-xl md:text-4xl font-light text-white uppercase">{data.timezoneAbbr}</span>
            </div>

            <div className="text-xl md:text-2xl font-bold text-white tracking-[0.3em] uppercase pl-2">
              In {data.location.split(',')[0]}
            </div>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="group flex items-center justify-between bg-white text-black w-40 h-14 rounded-full pl-6 pr-2 hover:w-44 transition-all duration-300"
          >
            <span className="font-bold tracking-[0.2em] text-xs opacity-50 uppercase">
              {isExpanded ? 'Less' : 'More'}
            </span>
            <div className="w-10 h-10 bg-[#303030] rounded-full flex items-center justify-center text-white transition-transform duration-500 group-hover:bg-black">
              {isExpanded ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
            </div>
          </button>
        </div>
      </div>

      {/* Stats Panel (Slide Up) */}
      <div className={`absolute bottom-0 left-0 w-full h-[50vh] backdrop-blur-3xl transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] border-t border-white/10 z-20 ${isExpanded ? 'translate-y-0' : 'translate-y-full'} 
        ${isNightMode ? 'bg-black/70 text-white' : 'bg-white/70 text-gray-900'}`}>

        <div className="h-full max-w-7xl mx-auto p-8 md:p-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 content-center gap-8 md:gap-12">
          <StatBox label="Current Timezone" value={data.timezone} />
          <StatBox label="Day of the Year" value={data.dayOfYear} />
          <StatBox label="Day of the Week" value={DAY_NAMES[data.dayOfWeek]} />
          <StatBox label="Week Number" value={data.weekNumber} />
        </div>
      </div>

    </main>
  );
}

// Simple Stat Component
const StatBox = ({ label, value }: { label: string, value: string | number }) => (
  <div className="flex md:flex-col justify-between md:justify-start items-center md:items-start border-b md:border-b-0 border-current/20 pb-4 md:pb-0">
    <span className="uppercase tracking-[0.2em] text-[10px] md:text-xs opacity-60 mb-2">{label}</span>
    <span className="text-2xl md:text-5xl font-bold">{value}</span>
  </div>
);