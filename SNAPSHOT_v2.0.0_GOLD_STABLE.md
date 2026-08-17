# Sunday League 2026 — Snapshot Release v2.0.0-GOLD-STABLE

**Git Tag**: `v2.0.0-GOLD-STABLE`  
**Git Commit Hash**: `c5c6671`  
**Date**: August 17, 2026 (05:39 UTC / Aug 16 10:39 PM PST)

---

## 🏆 Snapshot Verification & Official Data

### 1. Completed Match Results (4/4 Official Fixtures)
- **`FIX-001`**: `MoMo Strikers 1 – 1 No Stamina Hustlers` (Week 1)
  - ⚽ 26' Roshan Acharya (Assist: Sandesh Shrestha)
  - ⚽ 38' Riman Bastola (Assist: Bhuwan Chaudhary)
  - 🟨 39' Riman Bastola
- **`FIX-002`**: `MoMo Strikers 1 – 1 Jhyap Warriors` (Week 1)
  - 🟨 21' Sabin Shrestha
  - ⚽ 26' Rohit Thapa (Assist: Sabin Shrestha)
  - ⚽ 35' Roshan Acharya (Assist: Bijay Badal)
- **`FIX-003`**: `Jhyap Warriors 0 – 2 No Stamina Hustlers` (Week 2)
  - ⚽ 14' Subash KC (Assist: Sonam Sherpa)
  - ⚽ 38' Riman Bastola (Assist: Pradip Rokka)
  - 🟨 43' Prabhakar Shrestha
  - ⭐ **MOTM**: Riman Bastola
- **`FIX-004`**: `Jhyap Warriors 2 – 1 MoMo Strikers` (Week 2)
  - ⚽ 9' Shahil (Assist: Sabin Shrestha)
  - 🟨 27' Nirmal Ghising
  - ⚽ 30' Roshan Acharya
  - ⚽ 33' Nirmal Ghising
  - ⭐ **MOTM**: Nirmal Ghising

### 2. Leaderboards & Telemetry Standings
- **Top Scorer (Goals)**: Roshan Acharya (3 Goals), Riman Bastola (2 Goals)
- **Top Playmaker (Assists)**: Sabin Shrestha (2 Assists), Sonam Sherpa (1), Pradip Rokka (1), Bhuwan Chaudhary (1), Sandesh Shrestha (1), Bijay Badal (1)
- **Man of the Match Awards**: Riman Bastola (1), Nirmal Ghising (1)

### 3. Core Engine Architecture Features
- **Client-Side Data Sanitization**: `sanitizeMatchesData()` in `firestoreService.ts` prevents stale Cloud Firestore snapshots from sticking or corrupting match telemetry.
- **Dynamic Goal & Score Calculator**: Computes scores directly from goal events if Firestore snapshot emits raw 0-0 on finished matches.
- **Automatic Cache Versioning (`v2026_08_17_V7_DYNAMIC_SCORE_CALC`)**: Auto-clears stale `localStorage` disk caches across all browsers and iPhone PWAs on boot.
- **Past Match Event & Score Correction Portal**: Enables Commissioner and Admins to edit events, goals, assists, and scores of completed games anytime.
- **Compact Live Console UI**: Features Live Score & Event Feed, compact `🔄 Reset` button, and digital clock.
