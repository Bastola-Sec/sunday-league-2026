import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };
import { INITIAL_MATCHES, INITIAL_TEAMS, INITIAL_NOTIFICATIONS } from '../data/mockData';

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

async function resetFirestoreToPreKickoff() {
  console.log('Resetting Cloud Firestore to pre-kickoff clean state...');
  
  // Wipe all existing matches from Firestore
  const matchesSnap = await getDocs(collection(db, 'matches'));
  console.log(`Clearing ${matchesSnap.docs.length} match documents...`);
  for (const docSnap of matchesSnap.docs) {
    await deleteDoc(doc(db, 'matches', docSnap.id));
    console.log(`- Deleted match doc: ${docSnap.id}`);
  }

  // Reseed default scheduled matches from INITIAL_MATCHES
  console.log('Reseeding pre-kickoff scheduled matches...');
  for (const match of INITIAL_MATCHES) {
    await setDoc(doc(db, 'matches', match.id), sanitizeForFirestore(match));
    console.log(`✓ Seeded pre-kickoff match ${match.id}: ${match.homeTeamId} vs ${match.awayTeamId} [scheduled]`);
  }

  console.log('Successfully reset Cloud Firestore database to pre-kickoff state!');
}

resetFirestoreToPreKickoff().catch(console.error);
