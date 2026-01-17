//Responsive background screen for various design time of the day


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
  Cpu,
  Settings,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  Keyboard
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, useSpring, useTransform, AnimatePresence, Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Assets - Desktop
import bgImageDaytimeDesktop from './assets/desktop/bg-image-daytime.jpg';
import bgImageNighttimeDesktop from './assets/desktop/bg-image-nighttime.jpg';
// Assets - Tablet
import bgImageDaytimeTablet from './assets/tablet/bg-image-daytime.jpg';
import bgImageNighttimeTablet from './assets/tablet/bg-image-nighttime.jpg';
// Assets - Mobile
import bgImageDaytimeMobile from './assets/mobile/bg-image-daytime.jpg';
import bgImageNighttimeMobile from './assets/mobile/bg-image-nighttime.jpg';
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

const fetchSystemUplink = async (): Promise<UplinkData> => {
  // Capture client time right before the request so we can keep the IP-based
  // time in sync with the local ticking clock.
  const clientTimeAtRequest = Date.now();
  const [geo, time] = await Promise.all([
    axios.get('https://free.freeipapi.com/api/json/', { timeout: 4000 }),
    axios.get('https://worldtimeapi.org/api/ip', { timeout: 4000 })
  ]);

  // WorldTime API returns the current datetime in the target timezone.
  const ipDate = new Date(time.data.datetime);

  return {
    location: `${geo.data.cityName}, ${geo.data.countryName}`,
    timezone: time.data.timezone,
    timezoneAbbr: time.data.abbreviation,
    dayOfYear: time.data.day_of_year,
    dayOfWeek: time.data.day_of_week,
    weekNumber: time.data.week_number,
    ipTimeAtRequest: ipDate.getTime(),
    clientTimeAtRequest
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

interface TimeSourceMeta {
  ipTimeAtRequest?: number;
  clientTimeAtRequest?: number;
}

type UplinkData = {
  location: string;
  timezone: string;
  timezoneAbbr: string;
  dayOfYear?: number;
  dayOfWeek?: number;
  weekNumber?: number;
} & TimeSourceMeta;

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
  const { data: serverData, isPending: isUplinkLoading } = useQuery<UplinkData>({
    queryKey: ['systemUplink'],
    queryFn: fetchSystemUplink,
    staleTime: 1000 * 60 * 60, // Consider data "fresh" for 1 hour
    refetchOnWindowFocus: true, // Auto-update when user returns to tab
  });

  const { t, i18n } = useTranslation();
  
  // Cycle through all supported languages
  const toggleLanguage = () => {
    const languages = ['en', 'fr', 'ar'];
    const currentIndex = languages.indexOf(i18n.language);
    const nextIndex = (currentIndex + 1) % languages.length;
    const newLang = languages[nextIndex];
    i18n.changeLanguage(newLang);
    triggerHaptic('light');
  };

  // Get locale for date/time formatting based on current language
  const getLocale = () => {
    const langMap: Record<string, string> = {
      'en': 'en-GB',
      'fr': 'fr-FR',
      'ar': 'ar-SA'
    };
    return langMap[i18n.language] || 'en-GB';
  };

  // Get next language code for display
  const getNextLanguageCode = () => {
    const languages = ['en', 'fr', 'ar'];
    const currentIndex = languages.indexOf(i18n.language);
    const nextIndex = (currentIndex + 1) % languages.length;
    return languages[nextIndex].toUpperCase();
  };

  // 2. Local Time State (Updates every second)
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. UI & override state
  const [quote, setQuote] = useState<Quote>({ content: '', author: '' });
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [isOverrideMode, setIsOverrideMode] = useState(false);
  const [overrideQuery, setOverrideQuery] = useState('');
  const [overrideError, setOverrideError] = useState('');
  const [manualOverride, setManualOverride] = useState<UplinkData | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);

  // 4. Merged Data Object
  // We use useMemo to combine Server Data with our Local Clock
  // and keep the displayed time locked to the IP-based or overridden timezone.
  const data: ClockData = useMemo(() => {
    const fallbackLocation = {
      location: 'Local System',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneAbbr: 'LOC',
    };

    const baseData = manualOverride || serverData || fallbackLocation;

    // If we have IP-based time data, compute the offset between local time and
    // the IP timezone time at the moment of the request. Then apply that offset
    // to the ticking local clock so it stays in sync with the remote timezone.
    let effectiveNow = currentTime;
    const offsetSource = manualOverride || serverData;
    if (offsetSource && offsetSource.ipTimeAtRequest && offsetSource.clientTimeAtRequest) {
      const offsetMs = offsetSource.ipTimeAtRequest - offsetSource.clientTimeAtRequest;
      effectiveNow = new Date(currentTime.getTime() + offsetMs);
    }

    // Use locale-aware time formatting based on current language
    const locale = getLocale();
    
    return {
      ...baseData,
      dayOfYear: getDayOfYear(effectiveNow),
      dayOfWeek: effectiveNow.getDay(),
      weekNumber: getWeekNumber(effectiveNow),
      time: effectiveNow.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: baseData.timezone
      }),
      currentHour: effectiveNow.getHours(),
      rawTime: effectiveNow
    };
  }, [serverData, currentTime, manualOverride, i18n.language]);

  const { speak } = useVoiceAssistant();

  // 4. Update the "isLoading" check
  // isUplinkLoading is true only on the very first boot
  const isLoading = isUplinkLoading && !hasInitialized;

  /* ================= 1. MOTION ENGINE ================= */
  // Spring physics: Damping removes jitter; Stiffness adds responsiveness
  const springConfig = { damping: 30, stiffness: 200, mass: 0.5 };
  const xRaw = useSpring(0, springConfig);
  const yRaw = useSpring(0, springConfig);

  // Map the raw sensor data to specific pixel/rotation ranges
  // Background moves more for deep depth
  const bgX = useTransform(xRaw, [-1, 1], [-40, 40]);
  const bgY = useTransform(yRaw, [-1, 1], [-40, 40]);
  const bgRotateX = useTransform(yRaw, [-1, 1], [5, -5]);
  const bgRotateY = useTransform(xRaw, [-1, 1], [-5, 5]);

  // UI moves slightly in the opposite direction (Parallax)
  const uiX = useTransform(xRaw, [-1, 1], [10, -10]);
  const uiY = useTransform(yRaw, [-1, 1], [10, -10]);

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
    // Normalize the input to a -1 to 1 range
    const x = e.gamma ? (e.gamma / 20) : 0;
    const y = e.beta ? (e.beta - 45) / 20 : 0;

    xRaw.set(x);
    yRaw.set(y);
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

  // Toast notification system
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      // Toggle stats panel
      if (e.key === 'm' || e.key === 'M') {
        setIsExpanded(prev => !prev);
        triggerHaptic('light');
      }
      // Toggle settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setShowSettings(prev => !prev);
        triggerHaptic('light');
      }
      // Toggle keyboard shortcuts help
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowKeyboardShortcuts(prev => !prev);
        triggerHaptic('light');
      }
      // Refresh quote
      if (e.key === 'r' || e.key === 'R') {
        refreshQuote();
      }
      // Toggle language
      if (e.key === 'l' || e.key === 'L') {
        toggleLanguage();
      }
      // Close modals with Escape
      if (e.key === 'Escape') {
        if (showLocationConfirm) setShowLocationConfirm(false);
        if (showSettings) setShowSettings(false);
        if (showKeyboardShortcuts) setShowKeyboardShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLocationConfirm, showSettings, showKeyboardShortcuts, triggerHaptic, refreshQuote, toggleLanguage]);

  const isNightMode = useMemo(() => {
    if (!data) return false;
    return data.currentHour >= 18 || data.currentHour < 6;
  }, [data]);

  // Device type detection for responsive backgrounds
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);

  // Select appropriate background based on device type and time of day
  const currentBg = useMemo(() => {
    if (isNightMode) {
      switch (deviceType) {
        case 'mobile':
          return bgImageNighttimeMobile;
        case 'tablet':
          return bgImageNighttimeTablet;
        default:
          return bgImageNighttimeDesktop;
      }
    } else {
      switch (deviceType) {
        case 'mobile':
          return bgImageDaytimeMobile;
        case 'tablet':
          return bgImageDaytimeTablet;
        default:
          return bgImageDaytimeDesktop;
      }
    }
  }, [isNightMode, deviceType]);

  // Gentle floating accents for extra motion depth
  const floatingOrbs = [
    { size: 260, top: '12%', left: '18%', color: 'rgba(59,130,246,0.25)', duration: 20 },
    { size: 200, top: '68%', left: '76%', color: 'rgba(236,72,153,0.18)', duration: 18 },
    { size: 180, top: '30%', left: '65%', color: 'rgba(16,185,129,0.2)', duration: 22 },
  ];

  const statsVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.08, delayChildren: 0.1, type: 'spring', damping: 18, stiffness: 160 }
    }
  };

  const statItem: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 180 } }
  };

  const handleStart = () => {
    setHasInitialized(true);
    if (!data) return;

    const greeting = data.location === 'Local System'
      ? t('voice.externalUnavailable')
      : `${t('voice.locationConfirm')} ${data.location}. Is this correct?`;

    safeSpeak(greeting, () => {
      if (data.location !== 'Local System') setShowLocationConfirm(true);
    });
  };

  const handleLocationConfirm = (ok: boolean) => {
    triggerHaptic(ok ? 'medium' : 'light');
    setShowLocationConfirm(false);
    if (ok && data) {
      const locale = getLocale();
      safeSpeak(`${t('voice.systemSync')} ${data.rawTime.toLocaleTimeString(locale, {
        hour: 'numeric',
        minute: 'numeric'
      })}.`);
    } else {
      safeSpeak(t('voice.proceedingOverride'));
      setIsOverrideMode(true);
      setShowLocationConfirm(true);
    }
  };

  // Mutation-based override (uses open-meteo geocoding API which includes timezone)
  const searchLocation = async (query: string): Promise<UplinkData> => {
    let hit: any | undefined;
    let lastError: any = null;

    // 1) Try open-meteo geocoding API first (includes timezone in response)
    try {
      const geoRes = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
        params: { 
          name: query, 
          count: 10, 
          language: 'en', 
          format: 'json' 
        },
        timeout: 8000
      });
      const results = geoRes.data?.results;
      if (!results || results.length === 0) {
        throw new Error('No results from geocoding provider.');
      }
      // Use the first result (most relevant)
      hit = results[0];
    } catch (err) {
      lastError = err;
      const errAny = err as any;
      console.info('Open-meteo geocoding failed, attempting fallback:', errAny?.response?.status || errAny?.message || errAny);
    }

    // 2) Fallback to proxy endpoints if open-meteo fails
    if (!hit) {
      try {
        const geoRes = await axios.get('/api-geocode/search', {
          params: { q: query, format: 'json', limit: 1 },
          timeout: 8000
        });
        hit = geoRes.data?.[0];
        if (!hit) throw new Error('No results from geocode provider.');
      } catch (err) {
        lastError = err;
      }
    }

    // 3) If still no hit, try nominatim proxy
    if (!hit) {
      try {
        const nomRes = await axios.get('/api-nominatim/search', {
          params: { q: query, format: 'json', limit: 1 },
          timeout: 8000,
          headers: { 'Accept-Language': 'en' }
        });
        hit = nomRes.data?.[0];
        if (!hit) throw new Error('No results from nominatim fallback.');
      } catch (err) {
        lastError = err;
      }
    }

    if (!hit) {
      // If all failed, propagate a helpful message
      const message = lastError?.response?.statusText || lastError?.message || 'Location not found.';
      throw new Error(message);
    }

    // Extract timezone - open-meteo includes it, others need separate lookup
    let timezone: string | undefined = hit.timezone;
    
    // If timezone not in response (fallback APIs), fetch it from coordinates
    if (!timezone && hit.latitude && hit.longitude) {
      try {
        const tzRes = await axios.get('https://api.open-meteo.com/v1/timezone', {
          params: { latitude: hit.latitude || hit.lat, longitude: hit.longitude || hit.lon },
          timeout: 8000
        });
        timezone = tzRes.data?.timezone;
      } catch (err) {
        console.warn('Timezone lookup failed:', err);
      }
    }

    if (!timezone) {
      throw new Error('Could not determine timezone for that place.');
    }

    // Get current time data for that timezone
    const timeRes = await axios.get(`https://worldtimeapi.org/api/timezone/${timezone}`, { timeout: 8000 });
    const ipDate = new Date(timeRes.data.datetime);

    // Construct location display name
    let locationName: string;
    if (hit.display_name) {
      // Nominatim format
      locationName = hit.display_name;
    } else if (hit.name && hit.country) {
      // Open-meteo format: "City, Country"
      locationName = `${hit.name}, ${hit.country}`;
    } else if (hit.name) {
      locationName = hit.name;
    } else {
      locationName = query; // Fallback to search query
    }

    return {
      location: locationName,
      timezone,
      timezoneAbbr: timeRes.data.abbreviation,
      dayOfYear: timeRes.data.day_of_year,
      dayOfWeek: timeRes.data.day_of_week,
      weekNumber: timeRes.data.week_number,
      ipTimeAtRequest: ipDate.getTime(),
      clientTimeAtRequest: Date.now()
    };
  };

  const overrideMutation = useMutation({
    mutationFn: searchLocation,
    onSuccess: (newData: UplinkData) => {
      setManualOverride(newData);
      setShowLocationConfirm(false);
      setIsOverrideMode(false);
      setHasInitialized(true);
      triggerHaptic('medium');
      safeSpeak(`${t('voice.overrideSuccess')} ${newData.location}.`);
      setOverrideError('');
      showToast(t('voice.overrideSuccess'), 'success');
    },
    onError: (error) => {
      console.error('Manual override failed:', error);
      setOverrideError(t('modal.overrideFailed'));
      safeSpeak(t('voice.overrideFailed'));
      showToast(t('modal.overrideFailed'), 'error');
    }
  });

  const handleOverrideSearch = () => {
    if (!overrideQuery.trim()) {
      setOverrideError(t('modal.enterCity'));
      return;
    }
    setOverrideError('');
    overrideMutation.mutate(overrideQuery);
  };

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-screen w-full bg-black text-white flex flex-col items-center justify-center font-mono gap-6"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Cpu className="text-blue-500" size={48} />
        </motion.div>
        <div className="flex flex-col items-center gap-3">
          <motion.span 
            className="tracking-[0.5em] text-xs"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {t('system.booting')}
          </motion.span>
          <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      </motion.div>
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
            <p className="text-blue-400 font-mono text-xs tracking-[0.4em]">{t('system.systemVersion')}</p>
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white drop-shadow-2xl">
              {t('system.clockOS')}
            </h1>
          </div>
          <button
            onClick={requestSensors}
            className="group relative px-12 py-5 bg-white text-black font-bold tracking-[0.3em] rounded-full hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] uppercase text-xs"
          >
            <span className="relative z-10">{t('button.initialize')}</span>
            <div className="absolute inset-0 rounded-full bg-blue-500 scale-0 group-hover:scale-110 opacity-0 group-hover:opacity-20 transition-all duration-500" />
          </button>
        </div>
      </main>
    );
  }

  /* ================= MAIN UI ================= */

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black font-sans perspective-[1500px]">

      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 z-30 flex gap-3">
        <motion.button
          onClick={() => setShowKeyboardShortcuts(true)}
          className="px-4 py-2 rounded-full border border-white/20 text-white/80 text-xs tracking-[0.2em] bg-white/5 backdrop-blur-md hover:text-white"
          whileHover={{ scale: 1.05, opacity: 1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Keyboard shortcuts"
        >
          <Keyboard size={16} className="inline mr-2" />
          ?
        </motion.button>
        <motion.button
          onClick={() => setShowSettings(true)}
          className="px-4 py-2 rounded-full border border-white/20 text-white/80 text-xs tracking-[0.2em] bg-white/5 backdrop-blur-md hover:text-white"
          whileHover={{ scale: 1.05, opacity: 1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Settings"
        >
          <Settings size={16} />
        </motion.button>
        <motion.button
          onClick={toggleLanguage}
          className="px-4 py-2 rounded-full border border-white/20 text-white/80 text-xs tracking-[0.2em] bg-white/5 backdrop-blur-md hover:text-white"
          whileHover={{ scale: 1.05, opacity: 1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Change language"
        >
          {getNextLanguageCode()}
        </motion.button>
      </div>

      {/* 1. PHYSICAL BACKGROUND (Motion-Optimized) */}
      <motion.div
        style={{
          backgroundImage: `url(${currentBg})`,
          x: bgX,
          y: bgY,
          rotateX: bgRotateX,
          rotateY: bgRotateY,
          scale: 1.25,
          translateZ: -100, // True 3D depth
        }}
        className={`absolute inset-0 bg-cover bg-center will-change-transform transition-all duration-1000 ${isExpanded ? 'blur-md brightness-50' : 'blur-0'
          }`}
      />

      {/* 2. ATMOSPHERIC OVERLAYS */}
      <div className="absolute inset-0 bg-black/20 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

      {/* 2.5 FLOATING ORBS */}
      {floatingOrbs.map((orb, idx) => (
        <motion.div
          key={idx}
          className="absolute rounded-full blur-3xl mix-blend-screen pointer-events-none"
          style={{ width: orb.size, height: orb.size, top: orb.top, left: orb.left, background: `radial-gradient(circle at 30% 30%, ${orb.color}, transparent 60%)` }}
          animate={{ x: [0, 20, -18, 0], y: [0, -24, 18, 0], scale: [1, 1.04, 0.98, 1] }}
          transition={{ duration: orb.duration, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
      ))}

      {/* 3. LOCATION CONFIRM MODAL (AnimatePresence for smooth entry/exit) */}
      <AnimatePresence>
        {showLocationConfirm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, scale: 1, backdropFilter: "blur(24px)" }}
            exit={{ opacity: 0, scale: 0.9, backdropFilter: "blur(0px)" }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          >
            <div className="bg-black/80 border border-white/10 rounded-3xl p-8 md:p-12 text-center space-y-8 max-w-md w-full">
              <div className="relative">
                <MapPin size={48} className="mx-auto text-blue-400 animate-bounce" />
                <div className="absolute inset-0 bg-blue-400/20 blur-2xl rounded-full" />
              </div>
              <div className="space-y-2">
                <p className="text-white/40 uppercase tracking-[0.3em] text-[10px]">{t('modal.satelliteUplink')}</p>
                <h3 className="text-3xl font-black text-white uppercase">{data.location}</h3>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => handleLocationConfirm(true)}
                  className="flex-1 py-4 bg-white text-black font-bold rounded-xl hover:bg-blue-500 hover:text-white transition-all transform active:scale-95"
                >
                  {t('button.confirm')}
                </button>
                <button
                  onClick={() => {
                    setIsOverrideMode(true);
                    setOverrideError('');
                  }}
                  className="flex-1 py-4 border border-white/20 text-white font-bold rounded-xl hover:bg-white/5 transition-colors"
                >
                  {t('button.override')}
                </button>
              </div>
              {isOverrideMode && (
                <div className="space-y-3 text-left">
                  <label className="text-white/60 text-xs uppercase tracking-[0.25em]">{t('modal.searchCity')}</label>
                  <input
                    value={overrideQuery}
                    onChange={(e) => setOverrideQuery(e.target.value)}
                    placeholder={t('modal.searchPlaceholder')}
                    className="w-full bg-white/5 text-white rounded-xl px-4 py-3 border border-white/10 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleOverrideSearch}
                    disabled={overrideMutation.isPending}
                    className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-400 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {overrideMutation.isPending ? t('button.searching') : t('button.setOverride')}
                  </button>
                  {overrideError && <p className="text-red-400 text-sm">{overrideError}</p>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. FLOATING CONTENT LAYER */}
      <motion.div
        style={{ x: uiX, y: uiY }}
        className={`relative z-10 h-full transition-all duration-[1000ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${isExpanded ? '-translate-y-[40vh] md:-translate-y-[45vh]' : 'translate-y-0'
          }`}
      >
        <Container>
          <div className="flex flex-col justify-between h-screen py-10 md:py-16 lg:py-20">

            {/* HEADER with smooth fade */}
            <motion.header
              animate={{ opacity: isExpanded ? 0 : 1, y: isExpanded ? -20 : 0 }}
              className="transition-all"
            >
              <div className="flex flex-col gap-3 max-w-2xl bg-black/10 backdrop-blur-md p-6 rounded-2xl border border-white/5">
                <div className="flex items-start gap-4">
                  <p className="text-white text-base md:text-lg leading-relaxed font-normal italic">
                    {quote.content ? `“${quote.content}”` : t('system.uplinkActive')}
                  </p>
                  <button onClick={refreshQuote} className="mt-1 text-white/40 hover:text-white hover:rotate-180 transition-all duration-500">
                    <RefreshCw size={18} />
                  </button>
                </div>
                <span className="text-white font-bold text-sm tracking-widest uppercase opacity-90 border-l-2 border-blue-500 pl-3">
                  {quote.author || t('system.system')}
                </span>
              </div>
            </motion.header>

            {/* FOOTER (Main Display) */}
            <footer className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
              <motion.div layout className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-4 uppercase tracking-[0.3em] text-sm md:text-base font-medium text-white drop-shadow-md">
                  {isNightMode ? <Moon className="text-blue-300" size={24} /> : <Sun className="text-yellow-400" size={24} />}
                  {t(`greeting.${data.currentHour < 12 ? 'morning' : data.currentHour < 18 ? 'afternoon' : 'evening'}`)}
                  <span className="hidden md:inline">, {t('greeting.chief')}</span>
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
                  <span className="truncate max-w-[46vw] md:max-w-[420px]">{data.location}</span>
                  <button
                    onClick={() => {
                      setShowLocationConfirm(true);
                      setIsOverrideMode(true);
                      setOverrideError('');
                    }}
                    className="text-xs font-semibold tracking-[0.2em] text-white/60 hover:text-white underline-offset-4 underline"
                  >
                    {t('button.change')}
                  </button>
                </div>
              </motion.div>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsExpanded(!isExpanded);
                }}
                className="group flex items-center gap-4 bg-white hover:bg-blue-500 p-2 pl-6 md:pl-8 rounded-full transition-all self-start lg:mb-6 shadow-xl active:scale-90"
              >
                <span className="font-bold tracking-[0.3em] text-xs text-black/60 group-hover:text-white transition-colors">
                  {isExpanded ? t('button.less') : t('button.more')}
                </span>
                <div className="w-8 h-8 md:w-10 md:h-10 bg-black group-hover:bg-white group-hover:text-black rounded-full flex items-center justify-center text-white transition-transform">
                  {isExpanded ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                </div>
              </button>
            </footer>
          </div>
        </Container>
      </motion.div>

      {/* 5. STATS PANEL */}
      <motion.div
        initial={false}
        animate={{ y: isExpanded ? "0%" : "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
        className="absolute bottom-0 left-0 w-full h-[40vh] md:h-[45vh] z-20"
      >
        <div className={`absolute inset-0 backdrop-blur-3xl border-t border-white/10 ${isNightMode ? 'bg-black/80' : 'bg-white/70'
          }`} />

        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-1/2 hidden lg:block ${isNightMode ? 'bg-white/10' : 'bg-black/10'
          }`} />

        <Container>
          <motion.div
            className="relative h-full py-16 grid grid-cols-1 md:grid-cols-2 gap-y-8 md:gap-y-12 lg:gap-x-24 items-center"
            variants={statsVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={statItem}>
              <StatBox label={t('stats.timezone')} value={data.timezone} isNight={isNightMode} />
            </motion.div>
            <motion.div variants={statItem}>
              <StatBox label={t('stats.dayOfWeek')} value={data.dayOfWeek} isNight={isNightMode} />
            </motion.div>
            <motion.div variants={statItem}>
              <StatBox label={t('stats.dayOfYear')} value={data.dayOfYear} isNight={isNightMode} />
            </motion.div>
            <motion.div variants={statItem}>
              <StatBox label={t('stats.weekNumber')} value={data.weekNumber} isNight={isNightMode} />
            </motion.div>
          </motion.div>
        </Container>
      </motion.div>

      {/* Toast Notifications */}
      <div className="fixed top-24 right-6 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              className="bg-black/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 min-w-[280px] shadow-2xl"
            >
              {toast.type === 'success' && <CheckCircle2 className="text-green-400" size={20} />}
              {toast.type === 'error' && <AlertCircle className="text-red-400" size={20} />}
              {toast.type === 'info' && <Info className="text-blue-400" size={20} />}
              <span className="text-white text-sm flex-1">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xl p-6"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/90 border border-white/10 rounded-3xl p-8 max-w-md w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white uppercase tracking-wider">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label="Close settings"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-white/80 text-sm uppercase tracking-wider mb-2 block">Language</label>
                  <div className="flex gap-2">
                    {['en', 'fr', 'ar'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          i18n.changeLanguage(lang);
                          showToast(`Language changed to ${lang.toUpperCase()}`, 'success');
                        }}
                        className={`px-4 py-2 rounded-lg font-bold transition-all ${
                          i18n.language === lang
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-white/80 text-sm uppercase tracking-wider mb-2 block">Haptic Feedback</label>
                  <p className="text-white/60 text-xs mb-2">Vibration feedback for interactions</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerHaptic('light')}
                      className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors"
                    >
                      Test Light
                    </button>
                    <button
                      onClick={() => triggerHaptic('medium')}
                      className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors"
                    >
                      Test Medium
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-white/80 text-sm uppercase tracking-wider mb-2 block">System Info</label>
                  <div className="bg-white/5 rounded-lg p-4 space-y-2 text-xs text-white/60">
                    <div className="flex justify-between">
                      <span>Timezone:</span>
                      <span className="text-white">{data.timezone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span className="text-white truncate ml-4">{data.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mode:</span>
                      <span className="text-white">{isNightMode ? 'Night' : 'Day'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showKeyboardShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xl p-6"
            onClick={() => setShowKeyboardShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/90 border border-white/10 rounded-3xl p-8 max-w-lg w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                  <Keyboard size={24} />
                  Keyboard Shortcuts
                </h2>
                <button
                  onClick={() => setShowKeyboardShortcuts(false)}
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label="Close shortcuts"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                {[
                  { key: 'M', desc: 'Toggle stats panel' },
                  { key: 'R', desc: 'Refresh quote' },
                  { key: 'L', desc: 'Change language' },
                  { key: '?', desc: 'Show keyboard shortcuts' },
                  { key: '⌘,', desc: 'Open settings' },
                  { key: 'Esc', desc: 'Close modals' },
                ].map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between py-3 border-b border-white/10">
                    <span className="text-white/80">{shortcut.desc}</span>
                    <kbd className="px-3 py-1 bg-white/10 text-white rounded-lg text-sm font-mono border border-white/20">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}