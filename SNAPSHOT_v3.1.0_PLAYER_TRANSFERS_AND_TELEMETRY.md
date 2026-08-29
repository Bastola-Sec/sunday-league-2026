# Sunday League 2026 — Snapshot Release v3.1.0-TRANSFERS-AND-TELEMETRY

**Git Tag**: `v3.1.0-TRANSFERS-AND-TELEMETRY`
**Version**: `v3.1.0`
**Date**: August 28, 2026

---

## 🚀 Key Features Introduced in v3.1.0

### 1. Robust Player Transfer System
- Added a seamless **Player Transfer** capability within the Admin Portal Roster view.
- Admins can instantly transfer players between any active clubs in the league directly from the roster list.
- Automated data handling ensures that all historical player stats (Goals, Assists, MOTM awards) are perfectly preserved during the transfer, rather than resetting.
- The transfer system dynamically updates its club choices in real-time if new teams join the league.

### 2. Precise Live Telemetry Clock Synchronization
- Corrected a critical discrepancy between the UI's live ticking clock and the telemetry console's event logging.
- Created `getLiveMatchMinute` utility in `formatClock.ts`.
- Goals, cards, and substitutions are now correctly recorded with their exact real-time live match minute based on the kickoff timestamp (e.g., scoring in the 21st minute properly logs as `21'`, avoiding static database lags).

### 3. UI/UX Refinements
- **Scrollbar Elimination**: Completely removed unsightly default scrollbars across match cards, leaderboards, and side navigation menus, while preserving buttery smooth touch scrolling functionality via `-webkit-overflow-scrolling` and CSS scrollbar-width rules.
- **Admin Portal Defaults**: The fixture view in the Admin Portal now logically defaults to **"Upcoming Fixtures"** rather than showing past results first.
- **Menu Styling Polish**: Unified the "Sounds" and "Notification" controls inside the Slide-Out Menu to feature consistent sliding toggles, dynamic color states (emerald for ON, rose for OFF), and increased font legibility.
- **Form UI Polish**: Simplified the "Add Player" button text for a cleaner look.
