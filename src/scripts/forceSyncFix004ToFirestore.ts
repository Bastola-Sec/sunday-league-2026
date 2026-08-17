import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { INITIAL_MATCHES, INITIAL_TEAMS } from '../data/mockData';
import { computeStandingsAndFinalsMatch } from '../utils/leagueEngine';

async function main() {
  console.log('🔥 Overwriting all 4 official matches directly in Cloud Firestore...');

  for (const m of INITIAL_MATCHES) {
    const matchRef = doc(db, 'matches', m.id);
    await setDoc(matchRef, m, { merge: false });
    console.log(`✅ Overwrote ${m.id} (${m.homeTeamId} vs ${m.awayTeamId}) -> ${m.homeScore}-${m.awayScore} with ${m.events?.length || 0} events`);
  }

  const { updatedTeams } = computeStandingsAndFinalsMatch(INITIAL_TEAMS, INITIAL_MATCHES);
  for (const t of updatedTeams) {
    const teamRef = doc(db, 'teams', t.id);
    await setDoc(teamRef, t, { merge: true });
    console.log(`✅ Updated team ${t.name} stats in Firestore`);
  }

  console.log('🚀 ALL CLOUD FIRESTORE DOCUMENTS SUCCESSFULLY UPDATED!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Failed to force sync Firestore:', err);
  process.exit(1);
});
