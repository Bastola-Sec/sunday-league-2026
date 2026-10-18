import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, terminate } from 'firebase/firestore';
import * as fs from 'fs';

const cfg = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(cfg);
const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, cfg.firestoreDatabaseId);

async function check() {
  const snap = await getDocs(collection(db, 'teams'));
  for (const d of snap.docs) {
    const t = d.data();
    console.log('TEAM:', t.name, 'Trophies:', t.trophies);
    for (const p of t.roster || []) {
      if ((p.careerGoals && p.careerGoals > 0) || (p.goals && p.goals > 0) || (p.trophies && p.trophies.length > 0) || p.name.includes('Riman')) {
        console.log('  Player:', p.name, '(#', p.number, ') Goals:', p.goals, 'C-Goals:', p.careerGoals, 'C-Assists:', p.careerAssists, 'Trophies:', p.trophies);
      }
    }
  }
  await terminate(db);
  process.exit(0);
}
check().catch(console.error);
