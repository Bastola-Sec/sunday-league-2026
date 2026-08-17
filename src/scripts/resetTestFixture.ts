import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

async function resetTestFixture() {
  console.log('🔄 Resetting FIX-TEST-99 in Cloud Firestore...');

  const testFixture = {
    id: 'FIX-TEST-99',
    homeTeamId: 'momo-strikers',
    awayTeamId: 'no-stamina',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    matchSeconds: 0,
    isLive: false,
    isFinished: false,
    startTime: 'LIVE TEST FIXTURE (Ready for Admin Kickoff Test)',
    venue: 'De Anza Stadium (Test Pitch)',
    possessionHome: 50,
    possessionAway: 50,
    shotsHome: 0,
    shotsAway: 0,
    shotsOnTargetHome: 0,
    shotsOnTargetAway: 0,
    foulsHome: 0,
    foulsAway: 0,
    events: [],
    weekNumber: 99,
    matchType: 'Friendly',
    status: 'scheduled',
    halfDurationMinutes: 20,
    matchFormat: '7v7',
  };

  const matchRef = doc(db, 'matches', 'FIX-TEST-99');
  await setDoc(matchRef, testFixture, { merge: false });

  console.log('✅ FIX-TEST-99 successfully reset to 0-0 Scheduled!');
  process.exit(0);
}

resetTestFixture().catch((err) => {
  console.error('❌ Failed to reset test fixture:', err);
  process.exit(1);
});
