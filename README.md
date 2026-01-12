# 🚀 Clock OS v2.5 [Stable]

**Clock OS** is a high-performance, motion-aware web application that transforms browser environments into a sophisticated, neural-linked time interface. By leveraging **hardware-accelerated 3D parallax** and **asynchronous state management**, it provides a seamless, "native-app" feel.

---

## 🛠 Tech Stack

* **Framework:** React 18 (with TypeScript)
* **State Management:** [TanStack Query v5](https://tanstack.com/query/latest) (Server State & Caching)
* **Animation Engine:** [Framer Motion](https://www.framer.com/motion/) (GPU-Accelerated Spring Physics)
* **Styling:** Tailwind CSS (Glassmorphism & Frosted Glass)
* **Icons:** Lucide React
* **Sensors:** DeviceOrientation Event API (Gyroscope/Accelerometer)

---

## 🧠 Advanced Concepts Implemented

### 1. Asynchronous State Management (TanStack Query)

Unlike traditional state management, Clock OS treats geographical and time-zone data as **Server State**.

* **Stale-While-Revalidate:** The UI renders cached location data instantly while validating the uplink in the background.
* **Query Invalidation:** Automatic background syncing ensures location and timezone data remain accurate without manual refreshes.
* **Deduplication:** Multiple components can access system data without triggering redundant API calls.

### 2. High-Performance Motion Engine

The 3D parallax effect is decoupled from the React render cycle to maintain **60fps/120fps** performance.

* **Spring Physics:** Uses `useSpring` to filter raw sensor jitter into smooth, organic motion.
* **Compositor Threading:** Animations are offloaded to the browser's GPU using `transform` and `will-change` properties.
* **Motion Values:** Reactive values update the DOM directly, bypassing the Virtual DOM overhead for frame-by-frame movement.

### 3. Internationalization (i18n) Ready

The system is built with a global-first architecture:

* **Intl API:** Localized date and time formatting based on the user's browser locale.
* **Dynamic Theming:** Visuals shift based on `currentHour` (Day/Night modes).

---

## 🚀 Getting Started

1. **Clone the Repository:**
```bash
git clone https://github.com/your-repo/clock-os.git

```


2. **Install Dependencies:**
```bash
npm install

```


3. **Run Development Server:**
```bash
npm run dev

```



---

## 📁 Project Structure

```text
src/
├── assets/             # High-res background textures
├── components/         # Atomic UI components (StatBox, Container)
├── hooks/              # Custom hooks (useVoiceAssistant)
├── data/               # Local fallbacks (quotes.js)
├── i18n/               # Translation configuration [In Progress]
└── App.tsx             # Main OS Engine (Query Logic & Motion)

```

---

## 📡 System Uplinks

The OS relies on two primary satellite uplinks for synchronization:

* **IP-API:** Geolocation and city-level data.
* **WorldTimeAPI:** Precision UTC synchronization and timezone metadata.

---

## 🔮 Roadmap

* [ ] **Full i18n Support:** Localization for 5+ languages.
* [ ] **Offline Persistence:** TanStack Query `persistQueryClient` for zero-connectivity boot-up.
* [ ] **Dynamic Accent Colors:** Accent shifts based on current weather conditions.
