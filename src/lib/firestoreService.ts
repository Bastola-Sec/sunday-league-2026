import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db } from './firebase';
import { Team, Match, PushNotification, Player, SpecialTournament } from '../types';
import { INITIAL_TEAMS, INITIAL_MATCHES, INITIAL_NOTIFICATIONS } from '../data/mockData';

// Collection references
const TEAMS_COL = 'teams';
const MATCHES_COL = 'matches';
const NOTIFICATIONS_COL = 'notifications';
const SPECIAL_TOURNAMENTS_COL = 'special_tournaments';

const OFFICIAL_MATCH_IDS = new Set(INITIAL_MATCHES.map((m) => m.id));
const OFFICIAL_TEAM_IDS = new Set(INITIAL_TEAMS.map((t) => t.id));

/**
 * Recursively cleans undefined properties from an object or array before passing to Firestore
 * to prevent "Unsupported field value: undefined" errors.
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item)) as any;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Reset and seed Firestore with default official league dataset
 */
export async function resetFirestoreToDefaults(): Promise<void> {
  try {
    console.log('Resetting Firestore with official league dataset...');
    // Delete any old or test match documents from Firestore
    const matchesSnap = await getDocs(collection(db, MATCHES_COL));
    for (const docSnap of matchesSnap.docs) {
      await deleteDoc(doc(db, MATCHES_COL, docSnap.id));
    }

    // Delete any old or test team documents from Firestore
    const teamsSnap = await getDocs(collection(db, TEAMS_COL));
    for (const docSnap of teamsSnap.docs) {
      await deleteDoc(doc(db, TEAMS_COL, docSnap.id));
    }

    for (const team of INITIAL_TEAMS) {
      await setDoc(doc(db, TEAMS_COL, team.id), sanitizeForFirestore(team));
    }
    for (const match of INITIAL_MATCHES) {
      await setDoc(doc(db, MATCHES_COL, match.id), sanitizeForFirestore(match));
    }
    for (const notif of INITIAL_NOTIFICATIONS) {
      await setDoc(doc(db, NOTIFICATIONS_COL, notif.id), sanitizeForFirestore(notif));
    }
  } catch (err) {
    console.error('Failed to reset Firestore to default dataset:', err);
  }
}

/**
 * Delete all special events, special tournaments, and special matches from Firestore.
 */
export async function deleteAllSpecialEventsFromFirestore(): Promise<void> {
  try {
    console.log('Cleaning up all special event tournaments and matches from Firestore...');
    // Delete special_tournaments collection docs
    const tourneysSnap = await getDocs(collection(db, SPECIAL_TOURNAMENTS_COL));
    for (const docSnap of tourneysSnap.docs) {
      await deleteDoc(doc(db, SPECIAL_TOURNAMENTS_COL, docSnap.id));
    }

    // Delete any special event matches from matches collection
    const matchesSnap = await getDocs(collection(db, MATCHES_COL));
    for (const docSnap of matchesSnap.docs) {
      const data = docSnap.data() as Match;
      if (
        data.matchType === 'Special Event' ||
        data.matchType === 'Exhibition' ||
        !!data.tournamentId ||
        data.id.startsWith('FIX-TOURNAMENT') ||
        data.id.includes('SPECIAL') ||
        (data.venue && data.venue.includes('Dashain Cup')) ||
        data.homeTeamId.startsWith('spec-team-') ||
        data.homeTeamId.startsWith('team-') ||
        data.awayTeamId.startsWith('spec-team-') ||
        data.awayTeamId.startsWith('team-')
      ) {
        await deleteDoc(doc(db, MATCHES_COL, docSnap.id));
      }
    }

    // Delete any custom teams created for special events (spec-team-*, team-a, team-b, etc.)
    const teamsSnap = await getDocs(collection(db, TEAMS_COL));
    for (const docSnap of teamsSnap.docs) {
      if (
        docSnap.id.startsWith('spec-team-') ||
        (docSnap.id !== 'momo-strikers' && docSnap.id !== 'jhyap-warriors' && docSnap.id !== 'no-stamina')
      ) {
        await deleteDoc(doc(db, TEAMS_COL, docSnap.id));
      }
    }
    console.log('All special events deleted cleanly.');
  } catch (err) {
    console.error('Failed to clean up special events from Firestore:', err);
  }
}

/**
 * Initialize Firestore data by seeding default records if collections are empty.
 * Avoids destructive wiping loops on every load to prevent rate limit quota errors.
 */
export async function initializeFirestoreData(): Promise<void> {
  try {
    // Automatically wipe any temporary test special events per user request
    await deleteAllSpecialEventsFromFirestore();

    const teamsSnap = await getDocs(collection(db, TEAMS_COL));
    if (teamsSnap.empty) {
      for (const team of INITIAL_TEAMS) {
        await setDoc(doc(db, TEAMS_COL, team.id), sanitizeForFirestore(team));
      }
    }

    const matchesSnap = await getDocs(collection(db, MATCHES_COL));
    if (matchesSnap.empty) {
      for (const match of INITIAL_MATCHES) {
        await setDoc(doc(db, MATCHES_COL, match.id), sanitizeForFirestore(match));
      }
    } else {
      // Seed any missing official match fixtures (e.g. FIX-001..FIX-007) without wiping user edits
      const existingMatchIds = new Set(matchesSnap.docs.map((d) => d.id));


      for (const match of INITIAL_MATCHES) {
        if (!existingMatchIds.has(match.id)) {
          await setDoc(doc(db, MATCHES_COL, match.id), sanitizeForFirestore(match));
        }
      }
    }

    const notifsSnap = await getDocs(collection(db, NOTIFICATIONS_COL));
    if (notifsSnap.empty) {
      for (const notif of INITIAL_NOTIFICATIONS) {
        await setDoc(doc(db, NOTIFICATIONS_COL, notif.id), sanitizeForFirestore(notif));
      }
    }
  } catch (err) {
    console.error('Error initializing Firestore data:', err);
  }
}

/**
 * Subscribe to real-time updates for Teams collection.
 */
export function subscribeTeams(onUpdate: (teams: Team[]) => void) {
  const q = query(collection(db, TEAMS_COL));
  return onSnapshot(
    q,
    (snapshot) => {
      const teamsList: Team[] = snapshot.docs.map((doc) => doc.data() as Team);
      if (teamsList.length > 0) {
        onUpdate(teamsList);
      }
    },
    (error) => {
      console.error('Teams snapshot listener error:', error);
    }
  );
}

export function sanitizeMatchesData(rawMatches: Match[]): Match[] {
  const initMap = new Map(INITIAL_MATCHES.map((m) => [m.id, m]));

  return rawMatches
    .map((m) => {
      if (!m || !m.id) return null;
      const defaultFixture = initMap.get(m.id);

      if (defaultFixture) {
        const isFinishedMatch = m.isFinished !== undefined ? m.isFinished : (m.status === 'ended' || defaultFixture.isFinished);

        const effectiveEvents = m.events !== undefined ? m.events : (defaultFixture.events || []);

        const goalEvents = effectiveEvents.filter((e) => e.type === 'goal');
        const homeId = m.homeTeamId || defaultFixture.homeTeamId;
        const awayId = m.awayTeamId || defaultFixture.awayTeamId;

        const calcHomeScore = goalEvents.filter((e) => e.teamId === homeId).length;
        const calcAwayScore = goalEvents.filter((e) => e.teamId === awayId).length;

        // Respect live telemetry / user edits for scores, fallback to calculated goal count or default fixture score
        const finalHomeScore = m.homeScore !== undefined
          ? m.homeScore
          : (calcHomeScore > 0 ? calcHomeScore : (defaultFixture.homeScore ?? 0));

        const finalAwayScore = m.awayScore !== undefined
          ? m.awayScore
          : (calcAwayScore > 0 ? calcAwayScore : (defaultFixture.awayScore ?? 0));

        const isLiveMatch = !isFinishedMatch && (
          m.isLive === true ||
          m.status === '1st_half' ||
          m.status === '2nd_half' ||
          m.status === 'halftime'
        );

        return {
          ...defaultFixture,
          ...m,
          homeScore: finalHomeScore,
          awayScore: finalAwayScore,
          isLive: isLiveMatch,
          isFinished: isFinishedMatch,
          status: isFinishedMatch ? 'ended' : (m.status || defaultFixture.status),
          events: effectiveEvents,
        };
      }

      return m;
    })
    .filter((m): m is Match => m !== null);
}

/**
 * Subscribe to real-time updates for Matches collection.
 */
export function subscribeMatches(onUpdate: (matches: Match[]) => void) {
  const q = query(collection(db, MATCHES_COL));
  return onSnapshot(
    q,
    (snapshot) => {
      const matchesList: Match[] = snapshot.docs.map((doc) => doc.data() as Match);
      if (matchesList.length > 0) {
        onUpdate(sanitizeMatchesData(matchesList));
      }
    },
    (error) => {
      console.error('Matches snapshot listener error:', error);
    }
  );
}

/**
 * Subscribe to real-time updates for Notifications collection.
 */
export function subscribeNotifications(onUpdate: (notifs: PushNotification[]) => void) {
  const q = query(collection(db, NOTIFICATIONS_COL));
  return onSnapshot(
    q,
    (snapshot) => {
      const notifsList: PushNotification[] = snapshot.docs.map((doc) => doc.data() as PushNotification);
      if (notifsList.length > 0) {
        onUpdate(notifsList);
      }
    },
    (error) => {
      console.error('Notifications snapshot listener error:', error);
    }
  );
}

/**
 * Save or update a Team in Firestore.
 */
export async function saveTeamToFirestore(teamId: string, teamData: Partial<Team>): Promise<void> {
  try {
    const teamRef = doc(db, TEAMS_COL, teamId);
    const sanitized = sanitizeForFirestore(teamData);
    await setDoc(teamRef, sanitized as any, { merge: true });
  } catch (err) {
    console.error(`Failed to update team ${teamId} in Firestore:`, err);
  }
}

/**
 * Update squad roster for a Team in Firestore.
 */
export async function saveTeamRosterToFirestore(teamId: string, roster: Player[]): Promise<void> {
  try {
    const teamRef = doc(db, TEAMS_COL, teamId);
    const sanitized = sanitizeForFirestore({
      roster,
      squadCount: roster.length,
    });
    await updateDoc(teamRef, sanitized);
  } catch (err) {
    console.error(`Failed to update roster for team ${teamId} in Firestore:`, err);
  }
}

/**
 * Save or update a Match in Firestore.
 */
export async function saveMatchToFirestore(matchId: string, matchData: Partial<Match>): Promise<void> {
  try {
    const matchRef = doc(db, MATCHES_COL, matchId);
    const sanitized = sanitizeForFirestore(matchData);
    await setDoc(matchRef, sanitized as any, { merge: true });
  } catch (err) {
    console.error(`Failed to update match ${matchId} in Firestore:`, err);
  }
}

/**
 * Save a new Push Notification in Firestore.
 */
export async function saveNotificationToFirestore(notif: PushNotification): Promise<void> {
  try {
    const notifRef = doc(db, NOTIFICATIONS_COL, notif.id);
    const sanitized = sanitizeForFirestore(notif);
    await setDoc(notifRef, sanitized);
  } catch (err) {
    console.error(`Failed to save notification ${notif.id} in Firestore:`, err);
  }
}

/**
 * Completely overwrite a match in Firestore (replacing events/stats cleanly)
 */
export async function overwriteMatchInFirestore(matchId: string, matchData: Match): Promise<void> {
  try {
    const matchRef = doc(db, MATCHES_COL, matchId);
    const sanitized = sanitizeForFirestore(matchData);
    await setDoc(matchRef, sanitized as any);
  } catch (err) {
    console.error(`Failed to overwrite match ${matchId} in Firestore:`, err);
  }
}

/**
 * Delete a match from Firestore collection
 */
export async function deleteMatchFromFirestore(matchId: string): Promise<void> {
  try {
    const matchRef = doc(db, MATCHES_COL, matchId);
    await deleteDoc(matchRef);
  } catch (err) {
    console.error(`Failed to delete match ${matchId} from Firestore:`, err);
  }
}

/**
 * Real-time listener for Special Event Tournaments in Firestore
 */
export function subscribeSpecialTournaments(
  onData: (tournaments: SpecialTournament[]) => void
): () => void {
  const tournamentsRef = collection(db, SPECIAL_TOURNAMENTS_COL);
  return onSnapshot(
    tournamentsRef,
    (snapshot) => {
      const list: SpecialTournament[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as SpecialTournament);
      });
      onData(list);
    },
    (err) => {
      console.error('Error listening to special tournaments in Firestore:', err);
    }
  );
}

/**
 * Save or update a Special Event Tournament in Firestore
 */
export async function saveSpecialTournament(tournament: SpecialTournament): Promise<void> {
  try {
    const tourneyRef = doc(db, SPECIAL_TOURNAMENTS_COL, tournament.id);
    const sanitized = sanitizeForFirestore(tournament);
    await setDoc(tourneyRef, sanitized as any, { merge: true });
  } catch (err) {
    console.error(`Failed to save special tournament ${tournament.id} to Firestore:`, err);
  }
}

/**
 * Delete a Special Event Tournament from Firestore
 */
export async function deleteSpecialTournament(tournamentId: string): Promise<void> {
  try {
    const tourneyRef = doc(db, SPECIAL_TOURNAMENTS_COL, tournamentId);
    await deleteDoc(tourneyRef);
  } catch (err) {
    console.error(`Failed to delete special tournament ${tournamentId} from Firestore:`, err);
  }
}
