# 🚀 Clock OS v3.0 - Portfolio Editions

**Clock OS** is a high-performance, motion-aware web application that transforms browser environments into a sophisticated, neural-linked time interface. Built with cutting-edge web technologies, it delivers a seamless "native-app" experience with hardware-accelerated animations, intelligent state management, and full internationalization support.

![Clock OS](https://img.shields.io/badge/Version-3.0-blue) ![React](https://img.shields.io/badge/React-19.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

### 🌐 Core Functionality
- **Real-Time Clock** - Accurate time synchronization with IP-based timezone detection
- **Location Detection** - Automatic geolocation using IP-API with manual override capability
- **Multi-Timezone Support** - Switch between locations with real-time timezone calculations
- **Dynamic Theming** - Automatic day/night mode based on current hour (6 AM - 6 PM)

### 🎨 Visual Experience
- **3D Parallax Effects** - Hardware-accelerated motion using device orientation sensors
- **Responsive Backgrounds** - Optimized images for desktop, tablet, and mobile devices
- **Floating Orbs** - Atmospheric animated elements for visual depth
- **Glassmorphism UI** - Modern frosted glass effects with backdrop blur
- **Smooth Animations** - 60fps/120fps performance with Framer Motion

### 🌍 Internationalization
- **Multi-Language Support** - English (en), French (fr), and Arabic (ar)
- **Locale-Aware Formatting** - Date and time formats adapt to selected language
- **Dynamic Translations** - All UI elements fully translated
- **Voice Integration** - Spoken messages in selected language

### ⌨️ User Experience
- **Keyboard Shortcuts** - Power-user navigation without mouse
- **Toast Notifications** - Non-intrusive feedback for actions
- **Settings Panel** - Customizable preferences and system info
- **Haptic Feedback** - Vibration support for mobile devices
- **Voice Assistant** - Text-to-speech for location confirmation

### 📱 Responsive Design
- **Mobile Optimized** - Tailored backgrounds and layouts for mobile devices
- **Tablet Support** - Optimized experience for tablet screens
- **Desktop Enhanced** - Full feature set with rich visuals on desktop
- **Adaptive UI** - Components adjust based on screen size

### ♿ Accessibility
- **ARIA Labels** - Full screen reader support
- **Keyboard Navigation** - Complete keyboard accessibility
- **Semantic HTML** - Proper semantic structure
- **Focus Management** - Clear focus indicators

---

## 🛠 Tech Stack

### Core Framework
- **React 19** - Latest React with Concurrent Features
- **TypeScript 5.9** - Type-safe development
- **Vite 7** - Lightning-fast build tool and dev server

### State Management & Data Fetching
- **TanStack Query v5** - Server state management with automatic caching
  - Stale-while-revalidate pattern
  - Automatic background sync
  - Query deduplication
  - Optimistic updates

### Animation & Motion
- **Framer Motion 12** - GPU-accelerated animations
  - Spring physics for natural motion
  - Motion values for compositor thread rendering
  - Layout animations
  - Gesture support

### Internationalization
- **i18next 25** - Powerful i18n framework
- **react-i18next** - React bindings for i18next
- **i18next-browser-languagedetector** - Automatic language detection

### Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **Custom Animations** - Keyframe animations for effects

### Icons & UI
- **Lucide React** - Beautiful icon library
- **Custom Components** - Reusable UI components

### APIs & Services
- **Free IP API** - IP-based geolocation
- **World Time API** - Timezone and time data
- **Open-Meteo Geocoding API** - Location search and timezone lookup

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (or higher)
- **npm**, **pnpm**, or **yarn** package manager

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/vite-clock-app.git
cd vite-clock-app
```

2. **Install dependencies:**
```bash
# Using npm
npm install

# Using pnpm (recommended)
pnpm install

# Using yarn
yarn install
```

3. **Start the development server:**
```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

4. **Open your browser:**
Navigate to `http://localhost:5173` (or the URL shown in your terminal)

### Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## 📁 Project Structure

```
vite-clock-app/
├── src/
│   ├── assets/
│   │   ├── desktop/          # Desktop background images (daytime/nighttime)
│   │   ├── tablet/           # Tablet background images (daytime/nighttime)
│   │   ├── mobile/           # Mobile background images (daytime/nighttime)
│   │   └── favicon.png       # App favicon
│   ├── data/
│   │   └── quote.js          # Local quotes database
│   ├── hooks/
│   │   └── useVoiceAssistant.ts  # Text-to-speech hook
│   ├── App.tsx               # Main application component
│   ├── App.css               # Component styles
│   ├── App.test.tsx          # Component tests
│   ├── i18n.ts               # Internationalization configuration
│   ├── index.css             # Global styles and theme
│   ├── main.tsx              # Application entry point
│   └── setupTests.ts         # Test configuration
├── public/                   # Static assets
├── .gitignore
├── eslint.config.js          # ESLint configuration
├── index.html                # HTML template
├── package.json              # Dependencies and scripts
├── postcss.config.js         # PostCSS configuration
├── tsconfig.json             # TypeScript configuration
├── tsconfig.app.json         # App-specific TS config
├── tsconfig.node.json        # Node-specific TS config
└── vite.config.ts            # Vite configuration
```

---

## 🧠 Advanced Features

### 1. Asynchronous State Management (TanStack Query)

Clock OS treats geographical and timezone data as **Server State**, providing:

- **Stale-While-Revalidate** - Instant UI with background validation
- **Automatic Caching** - Data cached for 1 hour (configurable)
- **Query Deduplication** - Multiple components share the same query
- **Background Sync** - Automatic refresh when tab regains focus
- **Error Handling** - Graceful fallbacks to local data

**Example:**
```typescript
const { data: serverData, isPending } = useQuery({
  queryKey: ['systemUplink'],
  queryFn: fetchSystemUplink,
  staleTime: 1000 * 60 * 60, // 1 hour
  refetchOnWindowFocus: true,
});
```

### 2. High-Performance Motion Engine

The 3D parallax system uses **Motion Values** that update the GPU directly:

- **Spring Physics** - Smooth, organic motion with `useSpring`
- **Transform Mapping** - Sensor data mapped to pixel/rotation ranges
- **Compositor Thread** - Animations run on GPU, bypassing React render cycle
- **60fps/120fps** - Locked frame rate even with complex 3D tilts

**Key Implementation:**
```typescript
const xRaw = useSpring(0, { damping: 30, stiffness: 200 });
const bgX = useTransform(xRaw, [-1, 1], [-40, 40]);
const bgRotateX = useTransform(yRaw, [-1, 1], [5, -5]);
```

### 3. Responsive Background System

Dynamic background selection based on device type and time:

- **Device Detection** - Automatic detection of mobile/tablet/desktop
- **Breakpoints** - Mobile (<768px), Tablet (768-1023px), Desktop (≥1024px)
- **Time-Based** - Daytime/nighttime backgrounds change automatically
- **Optimized Assets** - Different resolutions for each device type

### 4. Intelligent Time Synchronization

Precise time calculation using IP-based timezone offset:

- **Client-Server Sync** - Captures timestamp offset at request time
- **Local Clock Integration** - Applies offset to local ticking clock
- **Timezone Awareness** - Handles DST and timezone transitions
- **Manual Override** - Users can override location with custom search

### 5. Full Internationalization (i18n)

Complete localization system with:

- **3 Languages** - English, French, Arabic
- **Dynamic Translations** - All UI elements translated
- **Locale-Aware Formatting** - Dates and times formatted per locale
- **Voice Integration** - Spoken messages in selected language
- **RTL Support** - Right-to-left layout for Arabic

### 6. Location Override System

Robust location search with multiple fallbacks:

1. **Primary**: Open-Meteo Geocoding API (includes timezone)
2. **Fallback 1**: Geocode.maps.co proxy
3. **Fallback 2**: Nominatim proxy with User-Agent headers

Features:
- Search by city name or place
- Automatic timezone detection
- Real-time time updates
- Error handling with user feedback

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `M` | Toggle stats panel (MORE/LESS) |
| `R` | Refresh quote |
| `L` | Change language |
| `?` or `Shift + /` | Show keyboard shortcuts |
| `⌘,` or `Ctrl + ,` | Open settings panel |
| `Esc` | Close modals |

**Note:** Shortcuts are disabled when typing in input fields.

---

## 🌍 Supported Languages

| Language | Code | Status |
|----------|------|--------|
| English | `en` | ✅ Complete |
| French | `fr` | ✅ Complete |
| Arabic | `ar` | ✅ Complete |

### Adding New Languages

1. Edit `src/i18n.ts`
2. Add language to `supportedLngs` array
3. Add translation resources in `resources` object
4. Test all UI elements are translated

---

## 📡 API Integrations

### Geolocation APIs

- **Free IP API** (`https://free.freeipapi.com/api/json/`)
  - Purpose: IP-based location detection
  - Returns: City, country, and geographic data

- **World Time API** (`https://worldtimeapi.org/api/ip`)
  - Purpose: Timezone and time synchronization
  - Returns: Timezone, datetime, day of year/week

### Geocoding APIs

- **Open-Meteo Geocoding** (`https://geocoding-api.open-meteo.com/v1/search`)
  - Purpose: Location search with timezone
  - Returns: Location data including timezone

- **Fallback APIs**
  - Geocode.maps.co proxy (via `/api-geocode/search`)
  - Nominatim proxy (via `/api-nominatim/search`)

### API Rate Limits

All APIs are free-tier with reasonable rate limits. The app implements:
- Request timeouts (4-8 seconds)
- Error handling with fallbacks
- Cached responses (1 hour for location data)

---

## 🎨 Customization

### Changing Theme Colors

Edit `src/index.css` to modify CSS variables:

```css
@theme {
  --color-primary: #303030;
  --color-secondary: #999999;
  --color-day-start: #f8f9fa;
  --color-night-start: #1a1a2e;
}
```

### Adding Custom Quotes

Edit `src/data/quote.js`:

```javascript
export default [
  {
    content: "Your quote here",
    author: "Author Name"
  },
  // Add more quotes...
];
```

### Modifying Breakpoints

Edit device detection in `src/App.tsx`:

```typescript
if (width < 768) {
  setDeviceType('mobile');
} else if (width < 1024) {
  setDeviceType('tablet');
} else {
  setDeviceType('desktop');
}
```

---

## 🧪 Testing

Run tests with:

```bash
npm run test
# or
pnpm test
```

The project uses **Vitest** for unit testing and **Testing Library** for component testing.

---

## 📦 Build & Deployment

### Production Build

```bash
npm run build
```

This creates an optimized production build in `dist/` with:
- Code minification
- Tree shaking
- Asset optimization
- TypeScript compilation

### Deployment Options

**Vercel (Recommended):**
```bash
npm i -g vercel
vercel
```

**Netlify:**
```bash
npm i -g netlify-cli
netlify deploy --prod
```

**GitHub Pages:**
```bash
npm run build
# Deploy dist/ directory to gh-pages branch
```

**Traditional Server:**
```bash
npm run build
# Upload dist/ directory to your server
```

---

## 🔧 Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run test suite |

### Code Style

The project uses:
- **ESLint** for code linting
- **TypeScript** for type checking
- **Prettier** (optional) for code formatting

---

## 🐛 Troubleshooting

### Common Issues

**1. Background images not loading:**
- Ensure all image files exist in `src/assets/` directories
- Check file names match imports exactly

**2. API errors:**
- Check internet connection
- Verify API endpoints are accessible
- App will fallback to local data automatically

**3. Device orientation not working:**
- Requires HTTPS (or localhost) for sensor access
- iOS requires user permission via button click
- Check browser console for permission errors

**4. i18n not loading:**
- Verify `src/i18n.ts` is imported in `main.tsx`
- Check language resources are properly configured
- Clear browser cache and reload

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update README.md for new features
- Follow existing code style
- Ensure accessibility standards

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Framer Motion** - Amazing animation library
- **TanStack Query** - Excellent server state management
- **i18next** - Powerful internationalization
- **Lucide** - Beautiful icon set
- **Tailwind CSS** - Utility-first CSS framework

### API Providers

- Free IP API - Geolocation services
- World Time API - Timezone data
- Open-Meteo - Geocoding services

---

## 🔮 Roadmap

### Planned Features

- [ ] **Weather Integration** - Display current weather for location
- [ ] **Multiple Locations** - Save and switch between multiple cities
- [ ] **Calendar Integration** - Show upcoming events
- [ ] **Custom Themes** - User-defined color schemes
- [ ] **Offline Mode** - Full functionality without internet
- [ ] **PWA Support** - Installable as a Progressive Web App
- [ ] **More Languages** - Support for 10+ languages
- [ ] **Accessibility Improvements** - Enhanced screen reader support

### Ideas & Suggestions

Have an idea? Open an issue or submit a PR!

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/vite-clock-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/vite-clock-app/discussions)
- **Email**: your-email@example.com

---

## ⭐ Show Your Support

If you find this project useful, please consider giving it a star on GitHub!

---

**Built with ❤️ using React, TypeScript, and modern web technologies.**
