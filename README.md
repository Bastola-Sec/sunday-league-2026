# ⚽ Sunday League 2026 — Modern 3D WebGL Football Platform & Match Telemetry

[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38BDF8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A state-of-the-art **Sunday League Football Platform** featuring an immersive **3D WebGL stadium canvas**, real-time **live match telemetry**, **FlashScore-style summary timelines**, 8v8 squad lineup builders, and live score synchronization powered by Cloud Firestore.

---

## 🌟 Key Features

### 🏟️ 3D WebGL Interactive Stadium
- **Dynamic Camera Swoops**: Smooth Three.js WebGL rendering that responds continuously as fans scroll from Hero view to Stadium, Standings, Top Clubs, and Live Action.
- **Cinematic Lighting & Pitch Graphics**: Dynamic stadium floodlights, periwinkle and teal atmospheric spotlights, interactive soccer ball physics, and procedural grass turf textures.

### ⏱️ Official Live Telemetry & State Controls
- **20-Minute Half Engine**: Custom Sunday League match clock tuned for 20-minute halves (`0'-20'` 1st Half, `20'-40'` 2nd Half) + added stoppage time (`+1'`, `+2'`, `+3'`, `+5'`).
- **1-Tap Rapid Event Logger**: Officials can tap category buttons (**Goal**, **Yellow Card**, **Red Card**, **Substitution**, **Shot on Target**, **Foul**, **Corner**) to open the auto-populating team roster wizard.
- **Automated Scoreline Syncing**: Real-time score progression (`0-0` ➔ `1-0` ➔ `2-0`) with automatic score rollbacks if an official deletes a duplicate goal event during audit logs.

### ⚠️ Automated Match Delay & Live FlashScore Summary
- **Scheduled Kickoff Monitor**: Displays a clean `⚠️ MATCH DELAYED` banner if scheduled kickoff time passes before official kickoff is triggered.
- **FlashScore Match Timelines**: Chronological breakdown of match events with minute markers (`14'`, `32'`), goal benchmark indicators (`1-0`), and side-by-side team alignment (Home on Left, Away on Right).
- **Completed Match Archive**: Past games automatically shift down into the Completed Results archive while maintaining 100% interactive telemetry access.

### 📋 8v8 Squad Lineups & Team Management
- **Official Starting 8 Picker**: Managers select their Starting 8 players and 8v8 tactical formations (`3-2-2`, `3-3-1`, `2-3-2`).
- **Manager Single Submit**: Secure lineup locking with real-time submission status synced to Firestore.
- **Locked Lineup Counter**: Spectators see player selection deadline countdowns until squad lineups are unlocked.

---

## 🛠️ Technology Stack

- **Frontend Core**: React 19, TypeScript, Vite
- **3D Graphics & Physics**: Three.js (Perspective Camera, SpotLights, Procedural Turf & Ball Physics)
- **Styling & UI Effects**: Tailwind CSS v4, Motion (Framer Motion), Lucide Icons, Glassmorphism Backdrop Filters
- **Database & Sync**: Google Cloud Firestore (AES-256 encrypted real-time data sync)

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js `v18.0.0` or higher
- npm or pnpm

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_GITHUB_USERNAME/sunday-league-2026.git
   cd sunday-league-2026
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` (or `http://<your-local-ip>:3000` to test on your phone).

4. **Verify TypeScript compilation & production build**:
   ```bash
   npm run lint
   npm run build
   ```

---

## ☁️ Deployment (100% Free on Vercel)

This application includes a pre-configured `vercel.json` for seamless Single-Page Application (SPA) routing.

### Deploying via Vercel Dashboard:
1. Push your repository to **GitHub**.
2. Visit **[vercel.com/new](https://vercel.com/new)** and import your repository.
3. Keep default settings (Framework Preset: **Vite**, Output Directory: `dist`).
4. Click **Deploy**. Your app will be live with free HTTPS SSL in 30 seconds!

---

## 🔒 Security & Data Encryption

- Firestore security rules enforce administrative authentication for match score updates and push notifications.
- All real-time telemetry transit is protected using **TLS 1.3** and stored encrypted at rest using **AES-256**.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
