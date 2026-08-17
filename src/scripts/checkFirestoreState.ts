import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function checkFirestore() {
  console.log('--- FETCHING MATCHES FROM CLOUD FIRESTORE ---');
  const snap = await getDocs(collection(db, 'matches'));
  snap.docs.forEach((doc) => {
    const data = doc.data();
    console.log(`[${doc.id}] homeScore=${data.homeScore} awayScore=${data.awayScore} motmPlayerName="${data.motmPlayerName}" eventsCount=${data.events?.length || 0}`);
  });
  process.exit(0);
}

checkFirestore().catch((err) => {
  console.error(err);
  process.exit(1);
});
