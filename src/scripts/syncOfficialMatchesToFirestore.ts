import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };
import { INITIAL_MATCHES } from '../data/mockData';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) cleaned[k] = sanitizeForFirestore(v);
    }
    return cleaned;
  }
  return obj;
}

async function syncOfficialMatches() {
  console.log('Syncing 7 official Sunday League matches to Cloud Firestore...');
  for (const match of INITIAL_MATCHES) {
    const matchRef = doc(db, 'matches', match.id);
    await setDoc(matchRef, sanitizeForFirestore(match), { merge: true });
    console.log(`✓ Synced ${match.id} [${match.homeTeamId} vs ${match.awayTeamId}] status=${match.status} score=${match.homeScore}-${match.awayScore}`);
  }
  console.log('Finished syncing official matches to Cloud Firestore!');
}

syncOfficialMatches().catch(console.error);
