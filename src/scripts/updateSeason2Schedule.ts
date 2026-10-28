import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, doc, setDoc, terminate } from 'firebase/firestore';
import * as fs from 'fs';

const cfg = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(cfg);
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, cfg.firestoreDatabaseId);

interface MatchDef {
  id: string;
  weekNumber: number;
  dateStr: string;
  timeStr: string;
  homeTeamId: string;
  awayTeamId: string;
  matchType: string;
  venue: string;
}

const schedule: MatchDef[] = [
  // --- Cycle 1 ---
  // Week 1: Sun, Nov 1
  // G1: Jhyap vs MoMo (MoMo stays as tired team)
  // G2: No Stamina vs MoMo (Fresh No Stamina plays Tired MoMo)
  {
    id: 'FIX-S2-001',
    weekNumber: 1,
    dateStr: 'Sun, Nov 1',
    timeStr: '8:30 AM',
    homeTeamId: 'jhyap-warriors',
    awayTeamId: 'momo-strikers',
    matchType: 'Regular',
    venue: 'De Anza Stadium (Pitch 1)',
  },
  {
    id: 'FIX-S2-002',
    weekNumber: 1,
    dateStr: 'Sun, Nov 1',
    timeStr: '9:30 AM',
    homeTeamId: 'no-stamina',
    awayTeamId: 'momo-strikers',
    matchType: 'Regular',
    venue: 'De Anza Stadium (Pitch 1)',
  },

  // Week 2: Sun, Nov 8
  // G1: No Stamina vs Jhyap (Jhyap stays as tired team)
  // G2: MoMo vs Jhyap (Fresh MoMo plays Tired Jhyap)
  {
    id: 'FIX-S2-003',
    weekNumber: 2,
    dateStr: 'Sun, Nov 8',
    timeStr: '8:30 AM',
    homeTeamId: 'no-stamina',
    awayTeamId: 'jhyap-warriors',
    matchType: 'Regular',
    venue: 'De Anza Stadium (Pitch 1)',
  },
  {
    id: 'FIX-S2-004',
    weekNumber: 2,
    dateStr: 'Sun, Nov 8',
    timeStr: '9:30 AM',
    homeTeamId: 'momo-strikers',
    awayTeamId: 'jhyap-warriors',
    matchType: 'Regular',
    venue: 'De Anza Stadium (Pitch 1)',
  },

  // Week 3: Sun, Nov 15
  // G1: MoMo vs No Stamina (No Stamina stays as tired team)
  // G2: Jhyap vs No Stamina (Fresh Jhyap plays Tired No Stamina)
  {
    id: 'FIX-S2-005',
    weekNumber: 3,
    dateStr: 'Sun, Nov 15',
    timeStr: '8:30 AM',
    homeTeamId: 'momo-strikers',
    awayTeamId: 'no-stamina',
    matchType: 'Regular',
    venue: 'De Anza Stadium (Pitch 1)',
  },
  {
    id: 'FIX-S2-006',
    weekNumber: 3,
    dateStr: 'Sun, Nov 15',
    timeStr: '9:30 AM',
    homeTeamId: 'jhyap-warriors',
    awayTeamId: 'no-stamina',
    matchType: 'Regular',
    venue: 'De Anza Stadium (Pitch 1)',
  },

  // --- Cycle 2 ---
  // Week 4: Sun, Nov 22
  // G1: MoMo vs Jhyap (Jhyap stays as tired team)
  // G2: No Stamina vs Jhyap (Fresh No Stamina plays Tired Jhyap)
  {
    id: 'FIX-S2-007',
    weekNumber: 4,
    dateStr: 'Sun, Nov 22',
    timeStr: '8:30 AM',
    homeTeamId: 'momo-strikers',
    awayTeamId: 'jhyap-warriors',
    matchType: 'Regular',
    venue: 'De Anza Stadium (Pitch 1)',
  },
  {
    id: 'FIX-S2-008',
    weekNumber: 4,
    dateStr: 'Sun, Nov 22',
    timeStr: '9:30 AM',
    homeTeamId: 'no-stamina',
    awayTeamId: 'jhyap-warriors',
    matchType: 'Regular',
    venue: 'De Anza Stadium (Pitch 1)',
  },

  // Week 5: Sun, Nov 29
  // G1: No Stamina vs MoMo (MoMo stays as tired team)
  // G2: Jhyap vs MoMo (Fresh Jhyap plays Tired MoMo)
  {
    id: 'FIX-S2-009',
    weekNumber: 5,
    dateStr: 'Sun, Nov 29',
    timeStr: '8:30 AM',
    homeTeamId: 'no-stamina',
    awayTeamId: 'momo-strikers',
    matchType: 'Regular',
    venue: 'De Anza Stadium (Pitch 1)',
  },
  {
    id: 'FIX-S2-010',
    weekNumber: 5,
    dateStr: 'Sun, Nov 29',
    timeStr: '9:30 AM',
    homeTeamId: 'jhyap-warriors',
    awayTeamId: 'momo-strikers',
    matchType: 'Regular',
    venue: 'De Anza Stadium (Pitch 1)',
  },

  // Week 6: Sun, Dec 6
  // G1: Jhyap vs No Stamina (No Stamina stays as tired team)
  // G2: MoMo vs No Stamina (Fresh MoMo plays Tired No Stamina)
  {
    id: 'FIX-S2-011',
    weekNumber: 6,
    dateStr: 'Sun, Dec 6',
    timeStr: '8:30 AM',
    homeTeamId: 'jhyap-warriors',
    awayTeamId: 'no-stamina',
    matchType: 'Regular',
    venue: 'De Anza Stadium (Pitch 1)',
  },
  {
    id: 'FIX-S2-012',
    weekNumber: 6,
    dateStr: 'Sun, Dec 6',
    timeStr: '9:30 AM',
    homeTeamId: 'momo-strikers',
    awayTeamId: 'no-stamina',
    matchType: 'Regular',
    venue: 'De Anza Stadium (Pitch 1)',
  },

  // --- Post-Season / Knockouts ---
  // --- Post-Season / Knockout Cups ---
  // Week 7: Sun, Dec 13
  // League Cup Final: 1st Place vs 2nd Place
  {
    id: 'FIX-S2-013',
    weekNumber: 7,
    dateStr: 'Sun, Dec 13',
    timeStr: '8:30 AM',
    homeTeamId: '1st Place',
    awayTeamId: '2nd Place',
    matchType: 'League Cup',
    venue: 'De Anza Stadium (Pitch 1)',
  },

  // Week 8: Sun, Dec 20
  // Match 1: Super Cup Qualifier (2nd Place vs 3rd Place) at 8:30 AM
  {
    id: 'FIX-S2-014',
    weekNumber: 8,
    dateStr: 'Sun, Dec 20',
    timeStr: '8:30 AM',
    homeTeamId: '2nd Place',
    awayTeamId: '3rd Place',
    matchType: 'Super Cup Qualifier',
    venue: 'De Anza Stadium (Pitch 1)',
  },

  // Match 2: Super Cup Final (1st Place vs Winner of Qualifier) at 10:00 AM on the SAME DAY
  {
    id: 'FIX-S2-015',
    weekNumber: 8,
    dateStr: 'Sun, Dec 20',
    timeStr: '10:00 AM',
    homeTeamId: '1st Place',
    awayTeamId: 'tbd',
    matchType: 'Super Cup Final',
    venue: 'De Anza Stadium (Pitch 1)',
  },
];

async function updateSeason2Schedule() {
  console.log('Updating Season 2 fixtures in Cloud Firestore...');
  for (const item of schedule) {
    const matchObj = {
      id: item.id,
      homeTeamId: item.homeTeamId,
      awayTeamId: item.awayTeamId,
      homeScore: 0,
      awayScore: 0,
      minute: 0,
      isLive: false,
      isFinished: false,
      startTime: `${item.dateStr} • ${item.timeStr}`,
      venue: item.venue,
      possessionHome: 50,
      possessionAway: 50,
      shotsHome: 0,
      shotsAway: 0,
      shotsOnTargetHome: 0,
      shotsOnTargetAway: 0,
      foulsHome: 0,
      foulsAway: 0,
      events: [],
      weekNumber: item.weekNumber,
      matchType: item.matchType,
      matchFormat: '8v8',
      halfDurationMinutes: 20,
      status: 'scheduled',
      seasonNumber: 2,
    };

    await setDoc(doc(db, 'matches', item.id), matchObj, { merge: true });
    console.log(`✓ Updated ${item.id}: W${item.weekNumber} ${item.dateStr} ${item.timeStr} - ${item.homeTeamId} vs ${item.awayTeamId} (${item.matchType})`);
  }
  console.log('Season 2 schedule updated successfully!');
  await terminate(db);
  process.exit(0);
}

updateSeason2Schedule().catch((err) => {
  console.error('Failed to update schedule:', err);
  process.exit(1);
});
