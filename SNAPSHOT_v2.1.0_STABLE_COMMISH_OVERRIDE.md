# 🏆 SUNDAY LEAGUE 2026 - SNAPSHOT `v2.1.0-STABLE-COMMISH-OVERRIDE`

**Snapshot Version Tag**: `v2.1.0-STABLE-COMMISH-OVERRIDE`  
**Git Commit Hash**: `e66c10f`  
**Created Date**: August 17, 2026  
**Status**: `GOLD STABLE - COMMISSIONER OVERRIDE PORTAL READY`

---

## 📌 1. Official League Results & Stats Summary

### ⚽ Match Results (Regular Season Weeks 1 & 2):
1. **`FIX-001`**: `MoMo Strikers 1 – 1 No Stamina Hustlers`
   - ⚽ 26' Roshan Acharya (Assist: Sandesh Shrestha)
   - ⚽ 38' Riman Bastola (Assist: Bhuwan Chaudhary)
   - 🟨 39' Riman Bastola
   - ⭐ **MOTM**: Roshan Acharya

2. **`FIX-002`**: `MoMo Strikers 1 – 1 Jhyap Warriors`
   - 🟨 21' Sabin Shrestha
   - ⚽ 26' Rohit Thapa (Assist: Sabin Shrestha)
   - ⚽ 35' Roshan Acharya (Assist: Bijay Badal)
   - ⭐ **MOTM**: Roshan Acharya

3. **`FIX-003`**: `Jhyap Warriors 0 – 2 No Stamina Hustlers`
   - ⚽ 14' Subash KC (Assist: Sonam Sherpa)
   - ⚽ 38' Riman Bastola (Assist: Pradip Rokka)
   - 🟨 43' Prabhakar Shrestha
   - ⭐ **MOTM**: Riman Bastola

4. **`FIX-004`**: `Jhyap Warriors 2 – 1 MoMo Strikers`
   - ⚽ 9' Shahil (Assist: Sabin Shrestha)
   - 🟨 27' Nirmal Ghising
   - ⚽ 30' Roshan Acharya
   - ⚽ 33' Nirmal Ghising *(Unassisted Solo Goal)*
   - ⭐ **MOTM**: Nirmal Ghising

5. **`FIX-TEST-99`**: `MoMo Strikers vs No Stamina Hustlers` *(Friendly Test Fixture)*
   - Status: `0 – 0 Scheduled` *(Wiped & Ready for Live Testing)*

---

## 📊 2. Official Leaderboards Baseline

### 🥇 Top Scorers (Golden Boot):
1. **Roshan Acharya** (MoMo Strikers) — ⚽ 3 Goals
2. **Riman Bastola** (No Stamina Hustlers) — ⚽ 2 Goals
3. **Nirmal Ghising** (Jhyap Warriors) — ⚽ 1 Goal
4. **Shahil** (Jhyap Warriors) — ⚽ 1 Goal
5. **Rohit Thapa** (Jhyap Warriors) — ⚽ 1 Goal
6. **Subash KC** (No Stamina Hustlers) — ⚽ 1 Goal

### 🅰️ Playmaker Leaderboard (Assists):
1. **Sabin Shrestha** (Jhyap Warriors) — 🅰️ 2 Assists *(FIX-002 26' & FIX-004 9')*
2. **Sonam Sherpa** (No Stamina Hustlers) — 🅰️ 1 Assist
3. **Pradip Rokka** (No Stamina Hustlers) — 🅰️ 1 Assist
4. **Bhuwan Chaudhary** (No Stamina Hustlers) — 🅰️ 1 Assist
5. **Sandesh Shrestha** (MoMo Strikers) — 🅰️ 1 Assist
6. **Bijay Badal** (MoMo Strikers) — 🅰️ 1 Assist

### ⭐ Player of the Match (MOTM):
1. **Roshan Acharya** (MoMo Strikers) — ⭐ 2 MOTM Awards *(FIX-001 & FIX-002)*
2. **Riman Bastola** (No Stamina Hustlers) — ⭐ 1 MOTM Award *(FIX-003)*
3. **Nirmal Ghising** (Jhyap Warriors) — ⭐ 1 MOTM Award *(FIX-004)*

---

## ⚙️ 3. Key Technical Specifications

1. **Commissioner Master Override Portal**:
   - Allows Commissioner to manually correct any scoreline, past goal, assist, yellow/red card, or MOTM award.
   - Includes manual player name / shirt number input fallback for arbitrary player entry.
2. **Live Clock Timer Engine (`timerSecondsRef`)**:
   - Refactored using a `useRef` accumulator to eliminate `useEffect` cleanup cancellation loops.
3. **Assist Clearing & Auto-Clean Description Engine**:
   - Dynamically strips out `(Assist: ...)` from descriptions and removes `assistPlayer` when cleared in event editor.
4. **Pre-Lifecycle Cache Versioning (`v2026_08_17_V104_SOLO_GOAL_ASSIST_FIX`)**:
   - Purges outdated disk memory on app startup across all clients.
